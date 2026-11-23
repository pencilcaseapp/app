import { useEffect } from 'react';
import type { RefObject } from 'react';

/** How far the content dissolves into what sits above and below it. */
const FADE_TOP = 16;
const FADE_BOTTOM = 24;

/**
 * The fade grows with the content behind the edge up to its full size, so
 * it eases in as the content starts to scroll instead of snapping on.
 */
const fadeSize = (distance: number, max: number) =>
  `${distance > 1 ? Math.min(Math.round(distance), max) : 0}px`;

export interface ScrollEdgeFadeOptions {
  /** Fade the top edge, for a scroll area with something above it. */
  top?: boolean;
  /** Fade the bottom edge, for a scroll area with something below it. */
  bottom?: boolean;
}

/*
 * Keeps the `--fade-top` and `--fade-bottom` of the `scroll-edge-fade`
 * utility in step with a scroll container, so an edge only dissolves
 * while it has content behind it and the area reads as ending where it
 * actually ends.
 */
export const useScrollEdgeFade = (
  ref: RefObject<HTMLElement | null>,
  { top = false, bottom = false }: ScrollEdgeFadeOptions = {},
) => {
  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const update = () => {
      const scrolled = element.scrollTop;
      const remaining
        = element.scrollHeight - element.scrollTop - element.clientHeight;

      element.style.setProperty(
        '--fade-top',
        top ? fadeSize(scrolled, FADE_TOP) : '0px',
      );
      element.style.setProperty(
        '--fade-bottom',
        bottom ? fadeSize(remaining, FADE_BOTTOM) : '0px',
      );
    };

    update();
    element.addEventListener('scroll', update, { passive: true });

    /*
     * The container resizing changes what fits, and its children resizing
     * changes what there is to scroll — neither shows up as a scroll
     * event. React keeps the same child nodes across renders, so
     * observing them once covers the content changing within them.
     */
    const observer = new ResizeObserver(update);
    observer.observe(element);

    for (const child of element.children) {
      observer.observe(child);
    }

    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [ref, top, bottom]);
};
