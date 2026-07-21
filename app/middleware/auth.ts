import { redirect, type MiddlewareFunction } from 'react-router';
import { userSessionContext } from '~/contexts/user-session';
import { getAuthenticatedUser, getSignInUrl } from '~/services/auth';

export const authMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    const url = new URL(request.url);
    const returnUrl = url.pathname + url.search;

    throw redirect(getSignInUrl(returnUrl));
  }

  context.set(userSessionContext, user);
};
