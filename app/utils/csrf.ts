import { CSRF } from 'remix-utils/csrf/server';
import { createCookie } from 'react-router';
import { getConfig } from '~/config';

const config = getConfig();

const tokenBytes = 64;

export const cookie = createCookie('csrf', {
  path: '/',
  httpOnly: true,
  secure: config.session.secure,
  sameSite: 'lax',
  secrets: [config.csrf.secret],
});

export const csrf = new CSRF({
  cookie,
  formDataKey: 'csrf',
  secret: config.csrf.secret,
});

/**
 * `CSRF#commitToken` hands back whatever string sits in the cookie, even one
 * the server would refuse (an empty or unsigned token). A browser holding
 * such a cookie then fails every submit with "Tampered CSRF token in cookie"
 * and never recovers, because the same broken value is written back on every
 * response. Issue a fresh token instead whenever the current one would be
 * rejected.
 */
export async function commitCsrfToken(
  request: Request,
): Promise<readonly [token: string, setCookieHeader: string | null]> {
  const existingToken = await cookie.parse(request.headers.get('cookie'));

  if (
    typeof existingToken === 'string'
    && await isAcceptedToken(existingToken, request.headers)
  ) {
    return [existingToken, null];
  }

  const token = csrf.generate(tokenBytes);

  return [token, await cookie.serialize(token)];
}

async function isAcceptedToken(token: string, headers: Headers) {
  const formData = new FormData();
  formData.set('csrf', token);

  try {
    await csrf.validate(formData, headers);
    return true;
  }
  catch {
    return false;
  }
}
