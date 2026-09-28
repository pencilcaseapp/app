import { Toast } from '@base-ui/react/toast';
import { useCallback } from 'react';
import { href } from 'react-router';
import { useAuthenticityToken } from 'remix-utils/csrf/react';
import type { ImagePayload } from '~/ui/editor/nodes/image-node';
import type { CopyImage } from '~/ui/editor/plugins/editor-plugin-images';
import { parseAssetSrc } from '~/utils/asset-src';

export const copyImageCopies = {
  failed: 'An image couldn’t be pasted. Please try again.',
};

/**
 * Copies an image pasted from another document into this one for the
 * editor, and tells the person when it does not work. An image of this
 * document, or one that is not ours at all, needs no copy.
 */
export const useCopyImage = (documentId: string): CopyImage => {
  const csrfToken = useAuthenticityToken();
  const { add } = Toast.useToastManager();

  return useCallback((image) => {
    const source = parseAssetSrc(image.src);

    if (!source || source.documentId === documentId) {
      return null;
    }

    const copy = async (): Promise<ImagePayload | undefined> => {
      try {
        const formData = new FormData();
        formData.set('csrf', csrfToken);
        formData.set('src', image.src);

        const response = await fetch(
          href('/doc/:id/assets/copies', { id: documentId }),
          { method: 'POST', body: formData },
        );

        if (!response.ok) {
          add({ type: 'danger', title: copyImageCopies.failed });
          return undefined;
        }

        const { src, width, height }: ImagePayload = await response.json();

        return { src, width, height };
      }
      catch {
        add({ type: 'danger', title: copyImageCopies.failed });
        return undefined;
      }
    };

    return copy();
  }, [documentId, csrfToken, add]);
};
