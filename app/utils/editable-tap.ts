/** How far a finger may travel before a touch counts as a scroll. */
const TAP_SLOP = 10;

/**
 * Calls `onTap` for a tap on editable content — the one touch that opens the
 * virtual keyboard. A scroll or a pull-to-refresh starts on the content just
 * the same but travels, and a focus the page moves there itself involves no
 * touch at all.
 */
export function listenForEditableTap(
  target: EventTarget,
  onTap: () => void,
): () => void {
  let start: { x: number; y: number } | null = null;

  const onTouchStart = (event: Event) => {
    const touch = (event as TouchEvent).touches[0];
    start = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const onTouchEnd = (event: Event) => {
    const touch = (event as TouchEvent).changedTouches[0];
    const element = event.target;

    if (
      start
      && touch
      && Math.hypot(touch.clientX - start.x, touch.clientY - start.y)
      < TAP_SLOP
      && element instanceof HTMLElement
      && element.isContentEditable
    ) {
      onTap();
    }

    start = null;
  };

  target.addEventListener('touchstart', onTouchStart, { passive: true });
  target.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    target.removeEventListener('touchstart', onTouchStart);
    target.removeEventListener('touchend', onTouchEnd);
  };
}
