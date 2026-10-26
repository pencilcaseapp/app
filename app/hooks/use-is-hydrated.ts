import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Whether React has hydrated the page.
 *
 * Unlike `useIsClient`, which is `false` on every first render, this is only
 * `false` while server rendering and hydrating: a component mounted by a
 * client-side navigation is `true` from its first render.
 */
export const useIsHydrated = () => useSyncExternalStore(
  subscribe,
  () => true,
  () => false,
);
