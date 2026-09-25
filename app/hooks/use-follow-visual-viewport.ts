import { useEffect, type RefObject } from 'react';

/** How long the viewport has to sit still before the element shows again. */
const SETTLE_DELAY = 250;

/**
 * A step of the viewport larger than this is iOS moving it on its own, in
 * one animated go, rather than the reader scrolling it frame by frame.
 */
const JUMP = 40;

/**
 * Keeps a `position: fixed` element at the top of what is on screen.
 *
 * With the keyboard open, iOS reveals the caret by moving what is on screen
 * over the page rather than scrolling it, and fixed elements stay behind
 * with the page. A reader scrolling moves it frame by frame, and the element
 * follows along. iOS moving it on its own animates the move, but reports
 * where it ends right away, so the element would sit halfway down the screen
 * for the length of it: then it is out of sight until the viewport settles,
 * and fades in where it belongs.
 */
export function useFollowVisualViewport(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const element = ref.current;
    const viewport = window.visualViewport;
    if (!element || !viewport || !enabled) {
      return;
    }

    let settle: ReturnType<typeof setTimeout>;
    let offset = viewport.offsetTop;

    const place = () => {
      element.style.transform = offset > 0 ? `translateY(${offset}px)` : '';
    };

    const show = () => {
      place();
      element.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 150, easing: 'ease-out' },
      );
      element.style.opacity = '';
    };

    const onMove = () => {
      const step = Math.abs(viewport.offsetTop - offset);
      offset = viewport.offsetTop;

      if (step < JUMP && element.style.opacity !== '0') {
        place();
        return;
      }

      element.style.opacity = '0';
      clearTimeout(settle);
      settle = setTimeout(show, SETTLE_DELAY);
    };

    // By the time the keyboard counts as open, the move has already begun.
    element.style.opacity = '0';
    settle = setTimeout(show, SETTLE_DELAY);
    viewport.addEventListener('scroll', onMove);
    viewport.addEventListener('resize', onMove);

    return () => {
      clearTimeout(settle);
      viewport.removeEventListener('scroll', onMove);
      viewport.removeEventListener('resize', onMove);
      element.style.transform = '';
      element.style.opacity = '';
    };
  }, [ref, enabled]);
}
