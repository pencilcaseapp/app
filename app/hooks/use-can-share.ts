import { useIsClient } from '@uidotdev/usehooks';

/**
 * Whether the browser can hand a link to the native share sheet.
 *
 * `navigator.share` does not exist while server rendering and is missing from
 * most desktop browsers, so the answer is `false` until the client has
 * hydrated.
 */
export const useCanShare = () => {
  const isClient = useIsClient();

  return isClient && typeof navigator !== 'undefined' && 'share' in navigator;
};
