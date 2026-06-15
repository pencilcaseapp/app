import { createOtp, canRequestNewOtp, type Otp, expireAllValidOtps, getValidOtp } from '~/repos/otp';
import { getOrCreateUserByEmail } from '~/repos/user';
import { sendEmailMagicCode } from './email-templates';
import argon2 from 'argon2';
import { randomBytes, randomInt } from 'node:crypto';
import { createCookie } from 'react-router';
import { getConfig } from '~/config';
import { createSession } from '~/repos/session';

const config = getConfig();

const sessionCookie = createCookie('session', {
  path: '/',
  httpOnly: true,
  secure: config.session.secure,
  secrets: [config.session.secret],
  sameSite: 'lax',
});

export enum InitMagicCodeError {
  TooManyRequests,
}

export type InitMagicCodeResult = [InitMagicCodeError] | [null, { otp: Otp }];

export async function initMagicCode(
  email: string,
): Promise<InitMagicCodeResult> {
  if (!await canRequestNewOtp(email)) {
    return [InitMagicCodeError.TooManyRequests];
  }

  await expireAllValidOtps(email);

  const user = await getOrCreateUserByEmail(email);
  const code = randomInt(100000, 1000000).toString();
  const codeHash = await argon2.hash(code);

  const otp = await createOtp({
    userId: user.id,
    email: user.email,
    codeHash,
  });

  await sendEmailMagicCode({
    to: {
      email: user.email,
    },
    code,
  });

  return [null, { otp }];
}

export enum VerifyMagicCodeError {
  Invalid,
}

export type VerifyMagicCodeResult
  = [VerifyMagicCodeError] | [null, { otp: Otp }];

export async function verifyMagicCode(id: string, email: string, code: string) {
  const otp = await getValidOtp(id);

  if (!otp || otp.email !== email) {
    return [VerifyMagicCodeError.Invalid];
  }

  const isValid = await argon2.verify(otp.codeHash, code);
  if (!isValid) {
    return [VerifyMagicCodeError.Invalid];
  }

  return [null, { otp }];
}

export async function createSessionCookie(userId: string) {
  const token = randomBytes(32);
  const tokenHash = await argon2.hash(token);
  const session = await createSession({ userId, tokenHash });

  return sessionCookie.serialize(token, {
    expires: session.expiresAt,
  });
}
