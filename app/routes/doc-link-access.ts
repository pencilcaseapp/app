import { data, type MiddlewareFunction } from 'react-router';
import { z } from 'zod';
import { DOCUMENT_LINK_ACCESS } from '~/constants/document';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { changeLinkAccess } from '~/services/document';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/doc-link-access';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({
  linkAccess: z.enum(DOCUMENT_LINK_ACCESS),
});

/**
 * Changes what anyone with the link may do. Posted to from the share panel;
 * the panel shows the new access optimistically while this runs.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(userSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const [error, result] = await changeLinkAccess({
    documentId: params.id,
    userId: user.id,
    linkAccess: form.data.linkAccess,
  });

  if (error !== null) {
    throw data('Forbidden', { status: 403 });
  }

  return { ok: true as const, linkAccess: result.linkAccess };
}
