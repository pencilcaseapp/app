import { redirect, type MiddlewareFunction } from 'react-router';
import { optionalUserSessionContext, sessionCookieHeaderContext, userSessionContext } from '~/contexts/user-session';
import { getAuthSession, getSignInUrl } from '~/services/auth';

export const sessionMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const session = await getAuthSession(request);

  context.set(optionalUserSessionContext, session?.user ?? null);
  context.set(sessionCookieHeaderContext, session?.cookieHeader ?? null);
};

export const authMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const user = context.get(optionalUserSessionContext);

  if (!user) {
    const url = new URL(request.url);
    const returnUrl = url.pathname + url.search;

    throw redirect(getSignInUrl(returnUrl));
  }

  context.set(userSessionContext, user);
};
