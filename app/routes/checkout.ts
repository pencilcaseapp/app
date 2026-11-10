import { href, redirect, type MiddlewareFunction } from 'react-router';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { getLatestDocumentId } from '~/services/document';
import type { Route } from './+types/checkout';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

/**
 * The stable address of the checkout, for the website's Buy button:
 * signs the visitor in if needed and starts the checkout over the
 * document they worked on last. `/doc/:id/checkout` decides from there,
 * so somebody already subscribed lands in the settings instead.
 */
export async function loader({ context }: Route.LoaderArgs) {
  const id = await getLatestDocumentId(context.get(userSessionContext));

  return redirect(href('/doc/:id/checkout', { id }));
}
