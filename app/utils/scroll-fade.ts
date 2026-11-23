/** How far content dissolves into what sits above and below it. */
export const SCROLL_FADE_TOP = 16;
export const SCROLL_FADE_BOTTOM = 24;

/**
 * The fade grows with the content behind the edge up to its full size, so
 * it eases in as the content starts to scroll instead of snapping on.
 */
export const scrollFadeSize = (distance: number, max: number) =>
  `${distance > 1 ? Math.min(Math.round(distance), max) : 0}px`;
