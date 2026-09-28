import { Toast } from '@base-ui/react/toast';
import { useCallback } from 'react';
import { href } from 'react-router';
import { useAuthenticityToken } from 'remix-utils/csrf/react';
import { MAX_ASSET_UPLOAD_BYTES } from '~/constants/asset';
import type { UploadImage } from '~/ui/editor/plugins/editor-plugin-images';

export const uploadImageCopies = {
  uploading: 'Uploading image …',
  tooLarge: 'This image is too large. Images can be up to 10 MB.',
  unsupported: 'This image type isn’t supported. '
    + 'Try a JPEG, PNG, WebP, GIF or AVIF.',
  failed: 'The image couldn’t be uploaded. Please try again.',
};

// Most uploads are done before this, and a toast that only flashes up
// reads as something having gone wrong.
const UPLOADING_TOAST_DELAY = 500;

interface UploadResponse {
  src: string;
  width: number;
  height: number;
}

/**
 * Uploads an image into a document for the editor, and tells the person
 * when it takes a moment or does not work.
 */
export const useUploadImage = (documentId: string): UploadImage => {
  const csrfToken = useAuthenticityToken();
  const { add, close } = Toast.useToastManager();

  return useCallback(async (file) => {
    if (file.size > MAX_ASSET_UPLOAD_BYTES) {
      add({ type: 'danger', title: uploadImageCopies.tooLarge });
      return undefined;
    }

    const formData = new FormData();
    formData.set('csrf', csrfToken);
    formData.set('file', file);

    let toastId: string | undefined;
    const timer = setTimeout(() => {
      toastId = add({
        type: 'info',
        title: uploadImageCopies.uploading,
        timeout: 0,
      });
    }, UPLOADING_TOAST_DELAY);

    try {
      const response = await fetch(
        href('/doc/:id/assets', { id: documentId }),
        { method: 'POST', body: formData },
      );

      if (!response.ok) {
        add({ type: 'danger', title: errorCopy(response.status) });
        return undefined;
      }

      const { src, width, height }: UploadResponse = await response.json();

      return { src, width, height };
    }
    catch {
      add({ type: 'danger', title: uploadImageCopies.failed });
      return undefined;
    }
    finally {
      clearTimeout(timer);

      if (toastId) {
        close(toastId);
      }
    }
  }, [documentId, csrfToken, add, close]);
};

function errorCopy(status: number) {
  switch (status) {
    case 413:
      return uploadImageCopies.tooLarge;
    case 415:
      return uploadImageCopies.unsupported;
    default:
      return uploadImageCopies.failed;
  }
}
