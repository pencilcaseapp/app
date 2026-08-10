import { useCallback, useMemo, useRef, useState } from 'react';

type Promotion = {
  key: string;
  id: number;
};

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
 * The returned `moveToTop` pulls a single item to the front, which is how an
 * edited document catches up with the order the server would return. It moves
 * the item once and the new order is remembered from then on, so a document
 * created afterwards still ends up above it.
 *
 * The order is only remembered for as long as the component stays mounted, a
 * full page load starts over with the order coming from the server.
 */
export function useStableOrder<T>(items: T[], getKey: (item: T) => string) {
  const orderRef = useRef<string[]>([]);
  const appliedPromotionRef = useRef(-1);
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  const orderedItems = useMemo(() => {
    const itemsByKey = new Map(items.map(item => [getKey(item), item]));
    const knownKeys = orderRef.current.filter(key => itemsByKey.has(key));
    const knownKeySet = new Set(knownKeys);
    const newKeys = [...itemsByKey.keys()]
      .filter(key => !knownKeySet.has(key));

    let keys = [...newKeys, ...knownKeys];

    // A move is a one-off: applying it to the remembered order and marking it
    // done keeps it from outranking items that only show up later.
    if (
      promotion
      && promotion.id !== appliedPromotionRef.current
      && itemsByKey.has(promotion.key)
    ) {
      appliedPromotionRef.current = promotion.id;
      keys = [promotion.key, ...keys.filter(key => key !== promotion.key)];
    }

    orderRef.current = keys;

    return orderRef.current
      .map(key => itemsByKey.get(key))
      .filter((item): item is T => item !== undefined);
  }, [items, getKey, promotion]);

  const moveToTop = useCallback((key: string) => {
    setPromotion(current => ({ key, id: (current?.id ?? 0) + 1 }));
  }, []);

  return [orderedItems, moveToTop] as const;
}
