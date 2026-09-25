import { useEffect, type RefObject } from 'react';

/** How long the viewport has to sit still before the element shows again. */
const SETTLE_DELAY = 250;

/** Quick to go, so it hardly travels with the page on its way out. */
const FADE_OUT_DURATION = 80;
const FADE_IN_DURATION = 150;

/**
 * Keeps a `position: fixed` element at the top of what is on screen.
 *
 * With the keyboard open, the page is taller than what is on screen, and iOS
 * moves what is on screen over the page — to reveal the caret, and as the
 * reader scrolls — while fixed elements stay behind with the page. Moving
 * the element along always trails the move by a frame, so it would jolt with
 * every step: instead it fades out while what is on screen moves, and fades
 * back in where it belongs once it settles. Scrolling the page itself moves
 * nothing on screen, and leaves the element where it is.
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

    const hide = () => {
      element.style.transition = `opacity ${FADE_OUT_DURATION}ms ease-out`;
      element.style.opacity = '0';
      clearTimeout(settle);
      settle = setTimeout(show, SETTLE_DELAY);
    };

    const show = () => {
      element.style.transition = `opacity ${FADE_IN_DURATION}ms ease-out`;
      element.style.transform = offset > 0 ? `translateY(${offset}px)` : '';
      element.style.opacity = '';
    };

    const onMove = () => {
      if (Math.round(viewport.offsetTop) === Math.round(offset)) {
        return;
      }

      offset = viewport.offsetTop;
      hide();
    };

    // By the time the keyboard counts as open, iOS has begun to move what is
    // on screen to reveal the caret, and reports where that move ends.
    hide();
    viewport.addEventListener('scroll', onMove);
    viewport.addEventListener('resize', onMove);

    return () => {
      clearTimeout(settle);
      viewport.removeEventListener('scroll', onMove);
      viewport.removeEventListener('resize', onMove);
      element.style.transform = '';
      element.style.opacity = '';
      element.style.transition = '';
    };
  }, [ref, enabled]);
}
