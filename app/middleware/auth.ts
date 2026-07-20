import { href, redirect, type MiddlewareFunction } from 'react-router';
import { requiredUserSessionContext, optionalUserSessionContext } from '~/contexts/user-session';
import { getAuthenticatedUser } from '~/services/auth';

export const requireAuthMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw redirect(href('/signin'));
  }

  context.set(requiredUserSessionContext, user);
};

export const optionalAuthMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const user = await getAuthenticatedUser(request);
  context.set(optionalUserSessionContext, user);
};
