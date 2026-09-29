import { useEffect, useState, type RefObject } from 'react';

/** The longest the preview waits for the editor's images. */
export const LIVE_IMAGES_TIMEOUT = 1000;

const LIVE = '[data-lexical-editor]';

/**
 * Whether the editor has decoded the images the server's preview is
 * showing, once `isSynced`. The editor's images are new elements, lazy and
 * hidden until the preview gives way, so Safari only loads and decodes them
 * once they are shown and leaves their box empty for a moment. They are
 * made eager and decoded behind the preview first, for as long as
 * `LIVE_IMAGES_TIMEOUT` at most.
 */
export function useLiveImagesReady(
  containerRef: RefObject<HTMLElement | null>,
  isSynced: boolean,
) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!isSynced || !container) {
      return;
    }

    let isCancelled = false;
    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const deadline = performance.now() + LIVE_IMAGES_TIMEOUT;
    const shownSources = [...container.querySelectorAll('img')]
      .filter(image => !image.closest(LIVE))
      .filter(image => image.complete && image.naturalWidth > 0)
      .map(getSource);

    const finish = () => {
      if (!isCancelled) {
        setIsReady(true);
      }
    };

    // The editor draws its images a frame or two after the sync.
    const waitForImages = () => {
      const images = [...container.querySelectorAll<HTMLImageElement>(
        `${LIVE} img`,
      )].filter(image => shownSources.includes(getSource(image)));

      if (
        images.length < shownSources.length
        && performance.now() < deadline
      ) {
        frame = requestAnimationFrame(waitForImages);
        return;
      }

      timeout = setTimeout(finish, Math.max(0, deadline - performance.now()));
      void Promise.all(images.map((image) => {
        image.loading = 'eager';

        return image.decode().catch(() => {});
      })).then(finish);
    };

    waitForImages();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [containerRef, isSynced]);

  return isReady;
}

/** An image may point at the CDN; `data-src` is the node's own source. */
function getSource(image: HTMLImageElement) {
  return image.dataset.src ?? image.getAttribute('src');
}
