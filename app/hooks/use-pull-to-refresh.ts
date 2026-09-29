import { useEffect, useState } from 'react';

export type PullToRefreshState = {
  /** How far the page is pulled past its top, in pixels. */
  distance: number;
  /** Pulled far enough: letting go refreshes. */
  armed: boolean;
  refreshing: boolean;
};

const IDLE: PullToRefreshState = {
  distance: 0,
  armed: false,
  refreshing: false,
};

/**
 * Follows the page being pulled down past its top. Safari reports the
 * rubber band iOS draws there as a negative `scrollY`, so the page keeps
 * its native bounce and this only reads how far it went. Only a pull made
 * with a finger counts: a flick that bounces off the top does not refresh.
 */
export const usePullToRefresh = ({
  enabled,
  threshold,
  onRefresh,
}: {
  enabled: boolean;
  threshold: number;
  onRefresh: () => void;
}) => {
  const [state, setState] = useState(IDLE);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let touching = false;
    let pulling = false;
    let armed = false;
    let refreshing = false;
    let frame: number | undefined;

    const read = () => {
      const distance = Math.max(0, -window.scrollY);

      if (!pulling && touching && distance > 0) {
        pulling = true;
      }

      if (pulling && touching && distance >= threshold) {
        armed = true;
      }

      if (pulling || refreshing) {
        setState(previous => (
          previous.distance === distance
          && previous.armed === armed
          && previous.refreshing === refreshing
            ? previous
            : { distance, armed, refreshing }
        ));
      }

      if (!touching && distance === 0 && !refreshing) {
        pulling = false;
        armed = false;
        frame = undefined;
        setState(IDLE);
        return;
      }

      frame = requestAnimationFrame(read);
    };

    const onTouchStart = () => {
      touching = true;
      frame ??= requestAnimationFrame(read);
    };

    // A touch the system cancels is let go of all the same.
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        return;
      }

      touching = false;

      if (armed && !refreshing) {
        refreshing = true;
        onRefresh();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);

      if (frame !== undefined) {
        cancelAnimationFrame(frame);
      }
    };
  }, [enabled, threshold, onRefresh]);

  return state;
};
