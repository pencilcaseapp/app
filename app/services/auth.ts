import { createOtp, canRequestNewOtp, type Otp, expireAllValidOtps, getValidOtp, markOtpAsUsed } from '~/repos/otp';
import { createUserSession, getOrCreateUserByEmail, getAndRefreshUserSession, updateUser, type User } from '~/repos/user';
import { sendEmailMagicCode } from './email-templates';
import argon2 from 'argon2';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { createCookieSessionStorage, href } from 'react-router';
import { getConfig } from '~/config';
import { getNormalizedReturnUrl, withSearchParams } from '~/utils/url';
import { getCanonicalEmail, normalizeEmail } from '~/utils/email';
import { SearchParamAuth } from '~/constants/search-params';

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
      domain: config.session.domain,
    },
  });

export enum InitMagicCodeError {
  TooManyRequests,
}

export type InitMagicCodeResult = [InitMagicCodeError] | [null, { otp: Otp }];

export async function initMagicCode(
  email: string,
): Promise<InitMagicCodeResult> {
  const to = normalizeEmail(email);
  const canonicalEmail = getCanonicalEmail(to);

  if (!await canRequestNewOtp(canonicalEmail)) {
    return [InitMagicCodeError.TooManyRequests];
  }

  await expireAllValidOtps(canonicalEmail);

  const code = randomInt(100000, 1000000).toString();
  const codeHash = await argon2.hash(code);

  const otp = await createOtp({
    email: to,
    canonicalEmail,
    codeHash,
  });

  await sendEmailMagicCode({
    to: {
      email: to,
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
  = [VerifyMagicCodeError] | [null, { otp: Otp; user: User }];

export async function verifyMagicCode(
  id: string, email: string, code: string,
): Promise<VerifyMagicCodeResult> {
  const otp = await getValidOtp(id);

  if (!otp || normalizeEmail(otp.email) !== normalizeEmail(email)) {
    return [VerifyMagicCodeError.Expired];
  }

  const isValid = await argon2.verify(otp.codeHash, code);
  if (!isValid) {
    return [VerifyMagicCodeError.Invalid];
  }

  await markOtpAsUsed(otp.id);

  // The user row only exists once the address is proven, so unverified
  // sign-in requests leave nothing behind but the OTP row.
  const user = await getOrCreateUserByEmail(normalizeEmail(otp.email));

  return [null, { otp, user }];
}

export async function getAuthSession(
  request: Request,
): Promise<{ user: User; cookieHeader: string | null } | null> {
  const result = await readUserSession(request.headers.get('Cookie'));
  if (!result) {
    return null;
  }

  const { cookieSession, userSession } = result;

  let cookieHeader: string | null = null;
  if (userSession.isRefreshed) {
    cookieHeader = await commitSession(cookieSession, {
      expires: userSession.session.expiresAt,
    });
  }

  return {
    user: userSession.user,
    cookieHeader,
  };
}

export async function getAuthUserByCookie(
  cookieHeader: string | null,
): Promise<User | null> {
  const result = await readUserSession(cookieHeader);

  return result?.userSession.user ?? null;
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

export async function onboardUser(
  userId: string,
  input: { name?: string; newsletter?: boolean },
) {
  const { name, newsletter } = input;
  await updateUser(userId, {
    name,
    newsletter,
    onboarded: true,
  });
}

export function getSignInUrl(returnUrl: string = href('/')) {
  return withSearchParams(href('/signin'),
    {
      [SearchParamAuth.ReturnUrl]: getNormalizedReturnUrl(returnUrl),
    });
}

async function readUserSession(cookieHeader: string | null) {
  const cookieSession = await getSession(cookieHeader);
  const token = cookieSession.get('token');
  if (!token) {
    return null;
  }

  const tokenHash = hashUserSessionToken(token);
  const userSession = await getAndRefreshUserSession(tokenHash);
  if (!userSession) {
    return null;
  }

  return { cookieSession, userSession };
}

function hashUserSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
