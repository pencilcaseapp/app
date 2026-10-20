import argon2 from 'argon2';
import { randomInt } from 'node:crypto';
import { transaction } from '~/db';
import {
  canRequestEmailChange,
  claimEmailChangeRequestAttempt,
  createEmailChangeRequest,
  expireAllValidEmailChangeRequests,
  expireEmailChangeRequest,
  getValidEmailChangeRequest,
  markEmailChangeRequestAsUsed,
  type EmailChangeRequest,
} from '~/repos/email-change-request';
import { getUserByEmail, updateUser, type User } from '~/repos/user';
import { getCanonicalEmail, normalizeEmail } from '~/utils/email';
import { signOutOtherSessions } from './auth';
import { sendEmailChangeCode } from './email-templates';
import { syncCreemCustomerEmail } from './subscription';

/**
 * Like the sign-in OTP: a wrong code burns one of these and the last one
 * expires the request, so a six digit code cannot be guessed within the
 * fifteen minutes it lives.
 */
const MAX_EMAIL_CHANGE_ATTEMPTS = 5;

export enum InitEmailChangeError {
  SameEmail,
  EmailTaken,
  TooManyRequests,
}

export type InitEmailChangeResult
  = [InitEmailChangeError] | [null, { request: EmailChangeRequest }];

/**
 * Starts a change of the user's address: the code goes to the new address
 * and nothing on the user row changes until `verifyEmailChange` accepts
 * it. Only one request per user is live at a time, so a resend
 * invalidates the code before it.
 */
export async function initEmailChange(
  user: User,
  newEmail: string,
): Promise<InitEmailChangeResult> {
  const email = normalizeEmail(newEmail);
  const canonicalEmail = getCanonicalEmail(email);

  if (email === normalizeEmail(user.email)) {
    return [InitEmailChangeError.SameEmail];
  }

  if (await getUserByEmail(email)) {
    return [InitEmailChangeError.EmailTaken];
  }

  if (!await canRequestEmailChange(user.id, canonicalEmail)) {
    return [InitEmailChangeError.TooManyRequests];
  }

  await expireAllValidEmailChangeRequests(user.id);

  const code = randomInt(100000, 1000000).toString();
  const codeHash = await argon2.hash(code);

  const request = await createEmailChangeRequest({
    userId: user.id,
    email,
    canonicalEmail,
    codeHash,
  });

  await sendEmailChangeCode({
    to: {
      email,
    },
    code,
    requestId: request.id,
    userId: user.id,
  });

  return [null, { request }];
}

export enum VerifyEmailChangeError {
  Expired,
  Invalid,
  EmailTaken,
}

export type VerifyEmailChangeResult
  = [VerifyEmailChangeError] | [null, { user: User }];

/**
 * Accepts the code and moves the user to the new address. The request has
 * to belong to the user of the session, so a code can never be redeemed
 * against another account. The address and the other sessions change
 * together: whoever could sign in through the old mailbox is signed out
 * in the same transaction, while the session behind `request` stays.
 */
export async function verifyEmailChange(
  user: User,
  requestId: string,
  code: string,
  request: Request,
): Promise<VerifyEmailChangeResult> {
  const change = await getValidEmailChangeRequest(requestId);

  if (!change || change.userId !== user.id) {
    return [VerifyEmailChangeError.Expired];
  }

  const attempt = await claimEmailChangeRequestAttempt(
    change.id, MAX_EMAIL_CHANGE_ATTEMPTS,
  );

  if (!attempt) {
    return [VerifyEmailChangeError.Expired];
  }

  const isValid = await argon2.verify(change.codeHash, code);
  if (!isValid) {
    if (attempt.attempts >= MAX_EMAIL_CHANGE_ATTEMPTS) {
      await expireEmailChangeRequest(change.id);
      return [VerifyEmailChangeError.Expired];
    }

    return [VerifyEmailChangeError.Invalid];
  }

  const result = await transaction(
    async (tx): Promise<VerifyEmailChangeResult> => {
      if (!await markEmailChangeRequestAsUsed(change.id, tx)) {
        return [VerifyEmailChangeError.Expired];
      }

      // Someone may have signed up with the address while the code was in
      // transit; the request is spent either way.
      if (await getUserByEmail(change.email)) {
        return [VerifyEmailChangeError.EmailTaken];
      }

      const updatedUser
        = await updateUser(user.id, { email: change.email }, tx);
      await signOutOtherSessions(request, user.id, tx);

      return [null, { user: updatedUser }];
    },
  );

  if (result[0] === null) {
    // The merchant of record bills and writes to the address it has.
    await syncCreemCustomerEmail(result[1].user);
  }

  return result;
}
