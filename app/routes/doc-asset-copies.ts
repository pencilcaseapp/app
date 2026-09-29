import { data, href } from 'react-router';
import { z } from 'zod';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { copyImage, CopyImageError } from '~/services/document';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/doc-asset-copies';

const formSchema = z.object({
  src: z.string(),
});

/**
 * Copies an image pasted from another document into this one. Open to
 * whoever may edit the document, signed in or through the link.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(optionalUserSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const [error, image] = await copyImage({
    documentId: params.id,
    viewer: user ?? undefined,
    src: form.data.src,
  });

  switch (error) {
    case null:
      return {
        ok: true as const,
        id: image.id,
        src: href('/doc/:id/assets/:assetId', {
          id: params.id,
          assetId: image.id,
        }),
        width: image.width,
        height: image.height,
      };
    case CopyImageError.NotFound:
      throw data('Not Found', { status: 404 });
    case CopyImageError.PermissionDenied:
      throw data('Forbidden', { status: 403 });
  }
}
