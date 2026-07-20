import { href, redirect, type MiddlewareFunction } from 'react-router';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import type { Route } from './+types/onboarding';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);

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
