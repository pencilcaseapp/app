import { useEffect, type RefObject } from 'react';
import { CURSOR_NAME_CLASS } from '~/ui/editor/editor-theme';

/** How close a name tag is allowed to come to the edge of the window. */
const VIEWPORT_MARGIN = 8;

/**
 * How far a name tag has to move sideways to stay inside the window. Lexical
 * anchors it to the cursor it belongs to, so somebody typing at the end of a
 * long line would otherwise have their name hanging off the screen.
 *
 * Moving away from one edge must not push the tag out at the other, so a tag
 * too wide for the window stays where it is rather than swapping which end is
 * cut off.
 */
export function getCursorNameOffset(
  rect: { left: number; right: number },
  viewportWidth: number,
  margin: number = VIEWPORT_MARGIN,
): number {
  const overflowRight = rect.right - (viewportWidth - margin);
  const roomOnTheLeft = rect.left - margin;

  if (overflowRight > 0 && roomOnTheLeft > 0) {
    return -Math.min(overflowRight, roomOnTheLeft);
  }

  return Math.max(-roomOnTheLeft, 0);
}

/**
 * Keeps the name tags of the remote cursors inside the window. Lexical writes
 * the cursors into the container itself, so they are read back out of the DOM
 * and nudged along their own axis, which leaves the plugin in charge of where
 * a cursor sits.
 */
export function useCursorNameBounds(
  containerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const update = () => {
      const viewportWidth = document.documentElement.clientWidth;
      const names = container.querySelectorAll<HTMLElement>(
        `.${CURSOR_NAME_CLASS}`,
      );

      for (const name of names) {
        name.style.removeProperty('transform');

        const offset = getCursorNameOffset(
          name.getBoundingClientRect(),
          viewportWidth,
        );

        if (offset !== 0) {
          name.style.setProperty('transform', `translateX(${offset}px)`);
        }
      }

      // Our own writes are queued for the observer too, and reacting to them
      // would move the tags we have just measured all over again.
      observer.takeRecords();
    };

    const observer = new MutationObserver(update);

    observer.observe(container, {
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef]);
}
