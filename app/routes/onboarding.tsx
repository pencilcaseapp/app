import { href, redirect, type MiddlewareFunction } from 'react-router';
import { requiredUserSessionContext } from '~/contexts/user-session';
import { requireAuthMiddleware } from '~/middleware/auth';
import type { Route } from './+types/onboarding';

export const middleware: MiddlewareFunction[] = [
  requireAuthMiddleware,
];

export function loader({ context }: Route.LoaderArgs) {
  const user = context.get(requiredUserSessionContext);

  if (user.onboarded) {
    return redirect(href('/home'));
  }

  return {
    user,
  };
}

export default function Onboarding(
  { loaderData }: Route.ComponentProps,
) {
  return (
    <>
      <title>Onboarding</title>
      <span>
        {loaderData.user.email}
      </span>
    </>
  );
}
