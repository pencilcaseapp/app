import { createOtp } from '~/repos/otp';
import { createUser, getUserByEmail } from '~/repos/user';
import { sendEmailMagicCode } from './email-templates';
import argon2 from 'argon2';
import { randomInt } from 'node:crypto';

export async function initMagicCode(email: string) {
  let user = await getUserByEmail(email);

  if (!user) {
    user = await createUser({
      email,
    });
  }

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

  return { otp };
}
