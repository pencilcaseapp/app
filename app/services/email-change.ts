import argon2 from 'argon2';
import { randomInt } from 'node:crypto';
import {
  canRequestEmailChange,
  createEmailChangeRequest,
  expireAllValidEmailChangeRequests,
  expireEmailChangeRequest,
  getValidEmailChangeRequest,
  markEmailChangeRequestAsUsed,
  recordFailedEmailChangeRequestAttempt,
  type EmailChangeRequest,
} from '~/repos/email-change-request';
import { getUserByEmail, updateUser, type User } from '~/repos/user';
import { getCanonicalEmail, normalizeEmail } from '~/utils/email';
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
 * against another account.
 */
export async function verifyEmailChange(
  user: User,
  requestId: string,
  code: string,
): Promise<VerifyEmailChangeResult> {
  const request = await getValidEmailChangeRequest(requestId);

  if (!request || request.userId !== user.id) {
    return [VerifyEmailChangeError.Expired];
  }

  const isValid = await argon2.verify(request.codeHash, code);
  if (!isValid) {
    const failed = await recordFailedEmailChangeRequestAttempt(request.id);

    if (failed && failed.attempts >= MAX_EMAIL_CHANGE_ATTEMPTS) {
      await expireEmailChangeRequest(request.id);
      return [VerifyEmailChangeError.Expired];
    }

    return [VerifyEmailChangeError.Invalid];
  }

  // Someone may have signed up with the address while the code was in
  // transit; the request is spent either way.
  await markEmailChangeRequestAsUsed(request.id);

  if (await getUserByEmail(request.email)) {
    return [VerifyEmailChangeError.EmailTaken];
  }

  const updatedUser = await updateUser(user.id, { email: request.email });

  // The merchant of record bills and writes to the address it has.
  await syncCreemCustomerEmail(updatedUser);

  return [null, { user: updatedUser }];
}
