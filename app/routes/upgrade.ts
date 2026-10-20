import { href, redirect, type MiddlewareFunction } from 'react-router';
import { userSessionContext } from '~/contexts/user-session';
import type { User } from '~/repos/user';
import { authMiddleware } from '~/middleware/auth';
import { getDocumentList } from '~/repos/document';
import { createDocument } from '~/services/document';
import type { Route } from './+types/upgrade';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

/**
 * The stable address of the upgrade, for emails and redirects: the
 * subscription settings live over a document, so this opens them over
 * the one the user worked on last — or over a fresh one for a user
 * without any. The search params travel along, which is how a toast
 * reaches the settings.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);
  const [latest] = await getDocumentList(user.id);
  const id = latest?.id ?? await createFirstDocument(user);

  return redirect(
    href('/doc/:id/settings/subscription', { id })
    + new URL(request.url).search,
  );
}

async function createFirstDocument(user: User) {
  const [error, document] = await createDocument(user);

  if (error !== null) {
    throw new Error('A user without documents is below the document limit');
  }

  return document.id;
}
