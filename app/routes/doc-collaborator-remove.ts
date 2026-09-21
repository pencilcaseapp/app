import { data, type MiddlewareFunction } from 'react-router';
import { z } from 'zod';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { removeCollaborator } from '~/services/document-invite';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/doc-collaborator-remove';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({});

/**
 * Takes an invited person's access away. Posted to from the row menu in
 * the share panel, which drops the row while this runs.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(userSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const [error, result] = await removeCollaborator({
    documentId: params.id,
    userId: user.id,
    collaboratorId: params.collaboratorId,
  });

  if (error !== null) {
    throw data('Forbidden', { status: 403 });
  }

  return { ok: true as const, id: result.id };
}
