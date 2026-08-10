import { useMemo, useRef } from 'react';

/**
 * Freezes the order in which `items` are rendered.
 *
 * The server sorts documents by `updatedAt`, so every revalidation (for
 * instance when navigating between documents) can hand back a differently
 * sorted list and make the navigation items jump around. This hook remembers
 * the order the items were first seen in and keeps it: items that disappeared
 * are dropped, items that are new are prepended in the order the server
 * returned them, everything else stays where it was.
 *
 * The order is only remembered for as long as the component stays mounted, a
 * full page load starts over with the order coming from the server.
 */
export function useStableOrder<T>(items: T[], getKey: (item: T) => string) {
  const orderRef = useRef<string[]>([]);

  return useMemo(() => {
    const itemsByKey = new Map(items.map(item => [getKey(item), item]));
    const knownKeys = orderRef.current.filter(key => itemsByKey.has(key));
    const knownKeySet = new Set(knownKeys);
    const newKeys = [...itemsByKey.keys()]
      .filter(key => !knownKeySet.has(key));

    orderRef.current = [...newKeys, ...knownKeys];

    return orderRef.current
      .map(key => itemsByKey.get(key))
      .filter((item): item is T => item !== undefined);
  }, [items, getKey]);
}
