import { href, redirect, type MiddlewareFunction } from 'react-router';
import { authMiddleware } from '~/middleware/auth';
import { userSessionContext } from '~/contexts/user-session';
import { createDocument } from '~/services/document';
import type { Route } from './+types/new';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

/**
 * The sidebar opens the upgrade dialog instead of linking here once the
 * free limit is reached, so a free account only lands in the upgrade
 * settings when it comes here some other way.
 */
export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);
  const [error, document] = await createDocument(user);

  if (error !== null) {
    return redirect(href('/upgrade'));
  }

  return redirect(href('/doc/:id', { id: document.id }));
}
