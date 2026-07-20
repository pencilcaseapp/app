import { createOtp, canRequestNewOtp, type Otp, expireAllValidOtps, getValidOtp, markOtpAsUsed } from '~/repos/otp';
import { createUserSession, getOrCreateUserByEmail, getUserBySessionTokenHash, type User } from '~/repos/user';
import { sendEmailMagicCode } from './email-templates';
import argon2 from 'argon2';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { createCookieSessionStorage } from 'react-router';
import { getConfig } from '~/config';

const config = getConfig();

const { getSession, commitSession }
  = createCookieSessionStorage<{ token: string }>({
    cookie: {
      name: 'session',
      path: '/',
      httpOnly: true,
      secure: config.session.secure,
      secrets: [config.session.secret],
      sameSite: 'lax',
    },
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
  Expired,
  Invalid,
}

export type VerifyMagicCodeResult
  = [VerifyMagicCodeError] | [null, { otp: Otp }];

export async function verifyMagicCode(
  id: string, email: string, code: string,
): Promise<VerifyMagicCodeResult> {
  const otp = await getValidOtp(id);

  if (!otp || otp.email !== email) {
    return [VerifyMagicCodeError.Expired];
  }

  const isValid = await argon2.verify(otp.codeHash, code);
  if (!isValid) {
    return [VerifyMagicCodeError.Invalid];
  }

  await markOtpAsUsed(otp.id);

  return [null, { otp }];
}

export async function getAuthenticatedUser(
  request: Request,
): Promise<User | null> {
  const cookieSession = await getSession(request.headers.get('Cookie'));
  const token = cookieSession.get('token');
  if (!token) {
    return null;
  }

  const tokenHash = hashUserSessionToken(token);
  const user = await getUserBySessionTokenHash(tokenHash);
  if (!user) {
    return null;
  }

  return user;
}

export async function createSessionCookie(input: {
  request: Request; userId: string; userAgent?: string; }) {
  const { request, userId, userAgent } = input;
  const cookieSession = await getSession(
    request.headers.get('Cookie'),
  );
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashUserSessionToken(token);
  const session = await createUserSession({ userId, tokenHash, userAgent });

  cookieSession.set('token', token);

  return commitSession(cookieSession, {
    expires: session.expiresAt,
  });
}

function hashUserSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
