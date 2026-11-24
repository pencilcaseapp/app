import { data, type MiddlewareFunction } from 'react-router';
import { z } from 'zod';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { pinDocument, unpinDocument } from '~/services/document';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/doc-pin';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({
  pinned: z.boolean(),
});

/**
 * Pins the document to the top of the user's navigation or unpins it.
 * Posted to from the row menu in the sidebar, which moves the row
 * optimistically while this runs.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(userSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  if (!form.data.pinned) {
    await unpinDocument(params.id, user.id);

    return { ok: true as const, pinned: false };
  }

  const [error] = await pinDocument(params.id, user);

  if (error !== null) {
    throw data('Not Found', { status: 404 });
  }

  return { ok: true as const, pinned: true };
}
