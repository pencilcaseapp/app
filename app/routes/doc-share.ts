import { data, type MiddlewareFunction } from 'react-router';
import { z } from 'zod';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { shareDocument } from '~/services/document';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/doc-share';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({
  shared: z.boolean(),
});

/**
 * Turns the link on or off. Posted to from the share panel's switch, which
 * shows the new state optimistically while this runs.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(userSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const [error, result] = await shareDocument({
    documentId: params.id,
    userId: user.id,
    shared: form.data.shared,
  });

  if (error !== null) {
    throw data('Forbidden', { status: 403 });
  }

  return { ok: true as const, shared: result.shared };
}
