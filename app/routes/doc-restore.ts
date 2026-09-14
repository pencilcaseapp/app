import { data, type MiddlewareFunction } from 'react-router';
import { z } from 'zod';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { restoreDocument } from '~/services/document';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/doc-restore';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({});

/**
 * Undoes a soft deletion for the owner. Posted to from the sidebar's
 * deleted section; the fetcher revalidates the navigation afterwards.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(userSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const [error, result] = await restoreDocument(params.id, user.id);

  if (error !== null) {
    throw data('Forbidden', { status: 403 });
  }

  return { ok: true as const, id: result.id };
}
