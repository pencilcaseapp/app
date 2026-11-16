import { href, redirect, type MiddlewareFunction } from 'react-router';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { getLatestDocumentId } from '~/services/document';
import type { Route } from './+types/upgrade';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

/**
 * The stable address of the upgrade, for emails and redirects: opens the
 * subscription settings over the document the user worked on last. The
 * search params travel along, which is how a toast reaches the settings.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const id = await getLatestDocumentId(context.get(userSessionContext));

  return redirect(
    href('/doc/:id/settings/subscription', { id })
    + new URL(request.url).search,
  );
}
