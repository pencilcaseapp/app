import { href, redirect, type MiddlewareFunction } from 'react-router';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { redeemInviteCode } from '~/services/subscription';
import type { Route } from './+types/invite';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export async function loader({ context, params }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);

  await redeemInviteCode(user, params.code);

  return redirect(href('/'));
}
