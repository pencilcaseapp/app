import { href, redirect, type MiddlewareFunction } from 'react-router';
import { authMiddleware } from '~/middleware/auth';
import { userSessionContext } from '~/contexts/user-session';
import { createDocument } from '~/repos/document';
import type { Route } from './+types/new';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);
  const document = await createDocument({
    userId: user.id,
  });

  return redirect(href('/doc/:id', { id: document.id }));
}
