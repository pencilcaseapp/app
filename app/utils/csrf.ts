import { CSRF } from 'remix-utils/csrf/server';
import { createCookie } from 'react-router';
import { getConfig } from '~/config';

const config = getConfig();

export const cookie = createCookie('csrf', {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  secrets: [config.csrf.secret],
});

export const csrf = new CSRF({
  cookie,
  formDataKey: 'csrf',
  secret: config.csrf.secret,
});
