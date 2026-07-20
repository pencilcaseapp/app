import { href, redirect, type MiddlewareFunction } from 'react-router';
import { userSessionContext } from '~/contexts/user-session';
import { getAuthenticatedUser } from '~/services/auth';

export const authMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw redirect(href('/signin'));
  }

  context.set(userSessionContext, user);
};
