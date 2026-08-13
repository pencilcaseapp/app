import { data } from 'react-router';
import { z } from 'zod';
import type { Route } from './+types/join-document';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { connectCollaborator, getDocument } from '~/repos/document';
import { validateForm } from '~/utils/form';

const joinSchema = z.object({});

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(optionalUserSessionContext);

  if (!user) {
    throw data('Unauthorized', { status: 401 });
  }

  const form = await validateForm(request, joinSchema);

  if (!form.ok) {
    return form.formState;
  }

  const document = await getDocument(params.id);

  if (document && document.shared && document.userId !== user.id) {
    await connectCollaborator({
      documentId: document.id,
      userId: user.id,
    });
  }

  return { ok: true as const };
}
