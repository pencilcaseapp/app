import { createOtp, canRequestNewOtp, type Otp, expireAllValidOtps } from '~/repos/otp';
import { getOrCreateUserByEmail } from '~/repos/user';
import { sendEmailMagicCode } from './email-templates';
import argon2 from 'argon2';
import { randomInt } from 'node:crypto';

enum InitMagicCodeError {
  TooManyRequests,
}

export type InitMagicCodeResult = {
  ok: true;
  otp: Otp;
} | {
  ok: false;
  error: InitMagicCodeError;
};

export async function initMagicCode(email: string) {
  if (!await canRequestNewOtp(email)) {
    return {
      ok: false,
      error: InitMagicCodeError.TooManyRequests,
    };
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

  return { ok: true, otp };
}
