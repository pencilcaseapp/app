import { data, type MiddlewareFunction } from 'react-router';
import { z } from 'zod';
import { DOCUMENT_ACCESS } from '~/constants/document';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { changeCollaboratorAccess } from '~/services/document-invite';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/doc-collaborator-access';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({
  access: z.enum(DOCUMENT_ACCESS),
});

/**
 * Changes what an invited person may do. Posted to from the row menu in
 * the share panel, which shows the new access optimistically.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(userSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const [error, result] = await changeCollaboratorAccess({
    documentId: params.id,
    userId: user.id,
    collaboratorId: params.collaboratorId,
    access: form.data.access,
  });

  if (error !== null) {
    throw data('Forbidden', { status: 403 });
  }

  return { ok: true as const, access: result.access };
}
