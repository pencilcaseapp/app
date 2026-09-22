import { useCallback, useEffect, useRef, type RefObject } from 'react';
import {
  syncCursorPositions,
  type BaseBinding,
  type SyncCursorPositionsFn,
} from '@lexical/yjs';

export interface CursorRect {
  height: number;
  left: number;
  top: number;
}

/**
 * Where the caret of a remote selection belongs, or `null` when Lexical has
 * already put it in the right place.
 *
 * Lexical measures the caret by collapsing the selection range onto its focus
 * and asking the browser for the box. An empty line has no text to measure, so
 * the browser answers with an empty box and the caret ends up in the top left
 * corner of the page until the first character is typed. The range itself
 * still covers the line's `<br>` and does have a box, so the last line box of
 * the range is where the caret goes in the meantime.
 */
export function getEmptyLineCaretRect(
  caretRect: { height: number },
  rangeRects: readonly CursorRect[],
): CursorRect | null {
  if (caretRect.height > 0) {
    return null;
  }

  const lastRect = rangeRects.at(-1);

  return lastRect !== undefined && lastRect.height > 0 ? lastRect : null;
}

/**
 * A highlight holds the live range Lexical measured the cursor from. The
 * registry's own type allows a `StaticRange` as well, which has nothing to
 * measure, and an editor in another frame brings its own `Range` — so this
 * asks for the method rather than for the constructor.
 */
function isLiveRange(range: AbstractRange): range is Range {
  return 'getClientRects' in range;
}

/**
 * Writes a caret's position, leaving one that is already there untouched:
 * `useCursorNameBounds` watches the same container and moves the name tags
 * in answer, which would bounce back and forth with a write that changes
 * nothing.
 */
function placeCaret(caret: HTMLElement, rect: CursorRect): void {
  const style = caret.style;
  const position = {
    height: `${rect.height}px`,
    left: `${rect.left}px`,
    top: `${rect.top}px`,
  };

  for (const [property, value] of Object.entries(position)) {
    if (style.getPropertyValue(property) !== value) {
      style.setProperty(property, value);
    }
  }
}

/**
 * Moves the carets the browser could not measure onto the line they belong
 * to. Lexical keeps the selection range of every remote cursor in the CSS
 * highlight it draws the selection with, which is the only path this editor
 * asks for, so a cursor without one is left alone.
 */
export function placeEmptyLineCarets(binding: BaseBinding): void {
  const container = binding.cursorsContainer;
  const offsetParent = container === null ? null : container.offsetParent;

  if (offsetParent === null) {
    return;
  }

  const origin = offsetParent.getBoundingClientRect();

  for (const cursor of binding.cursors.values()) {
    const selection = cursor.selection;

    if (selection === null || selection.highlight === null) {
      continue;
    }

    for (const range of selection.highlight) {
      if (!isLiveRange(range)) {
        continue;
      }

      const caretRange = range.cloneRange();
      caretRange.collapse(false);

      const rect = getEmptyLineCaretRect(
        caretRange.getBoundingClientRect(),
        Array.from(range.getClientRects()),
      );

      if (rect !== null) {
        placeCaret(selection.caret, {
          height: rect.height,
          left: rect.left - origin.left,
          top: rect.top - origin.top,
        });
      }
    }
  }
}

/**
 * Draws the remote cursors, and keeps the ones on an empty line where they
 * belong.
 *
 * The selections are drawn with the browser's own highlights rather than one
 * absolutely positioned span per line rect, which drops lines it reads as
 * spanning the whole editor. Lexical redraws a cursor from two places — an
 * awareness update goes straight to `syncCursorPositions`, a Yjs document
 * change goes through the function returned here — and a cursor keeps
 * whichever rendering it was first drawn with, so the two have to agree on
 * the highlight.
 *
 * Only one of those two paths can be replaced, so the correction runs off the
 * cursors container instead: Lexical writes every caret position as an inline
 * style, whichever path drew it. The binding it needs reaches the editor
 * through that one function, so it is kept from the first call — which the
 * document's own contents already make as they load.
 */
export function useRemoteCursorPositions(
  containerRef: RefObject<HTMLElement | null>,
): SyncCursorPositionsFn {
  const bindingRef = useRef<BaseBinding | null>(null);

  const syncCursorPositionsFn = useCallback<SyncCursorPositionsFn>(
    (binding, provider) => {
      bindingRef.current = binding;
      syncCursorPositions(binding, provider, { selectionHighlight: true });
      placeEmptyLineCarets(binding);
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const update = () => {
      const binding = bindingRef.current;

      if (binding !== null) {
        placeEmptyLineCarets(binding);
      }

      // Our own writes are queued for the observer too, and there is
      // nothing in them left to answer.
      observer.takeRecords();
    };

    const observer = new MutationObserver(update);

    observer.observe(container, {
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [containerRef]);

  return syncCursorPositionsFn;
}
