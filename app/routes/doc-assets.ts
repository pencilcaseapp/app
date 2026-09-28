import { data, href } from 'react-router';
import { z } from 'zod';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { MAX_ASSET_UPLOAD_BYTES } from '~/constants/asset';
import { addImage, AddImageError } from '~/services/asset';
import { validateForm } from '~/utils/form';
import type { Route } from './+types/doc-assets';

const formSchema = z.object({
  file: z.file(),
});

// Room for the multipart framing and the CSRF token around the file.
const MAX_REQUEST_BYTES = MAX_ASSET_UPLOAD_BYTES + 64 * 1024;

/**
 * Adds an image dropped or pasted into the editor. Open to whoever may
 * edit the document, signed in or through the link.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const contentLength = Number(request.headers.get('content-length'));

  if (!contentLength || contentLength > MAX_REQUEST_BYTES) {
    throw data('Payload Too Large', { status: 413 });
  }

  const user = context.get(optionalUserSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const [error, image] = await addImage({
    documentId: params.id,
    viewer: user ?? undefined,
    file: form.data.file,
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
    case AddImageError.NotFound:
      throw data('Not Found', { status: 404 });
    case AddImageError.PermissionDenied:
      throw data('Forbidden', { status: 403 });
    case AddImageError.TooLarge:
      throw data('Payload Too Large', { status: 413 });
    case AddImageError.UnsupportedType:
      throw data('Unsupported Media Type', { status: 415 });
  }
}
