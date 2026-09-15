import { useEffect, useRef } from 'react';

/** Scrolls the window to the top whenever `trigger` turns true. */
export function useScrollToTopOn(trigger: boolean) {
  const previousRef = useRef(trigger);

  useEffect(() => {
    if (trigger && !previousRef.current) {
      window.scrollTo({ top: 0 });
    }

    previousRef.current = trigger;
  }, [trigger]);
}
