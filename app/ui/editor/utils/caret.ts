export interface CaretInset {
  top: number;
  bottom: number;
}

/**
 * The caret's rect in client coordinates, or `null` while the selection is
 * not in `container`. A collapsed range has no client rects in an empty
 * block (Lexical renders one as a lone `<br>`), so that falls back to the
 * block itself.
 */
const getCaretRect = (container: HTMLElement): DOMRect | null => {
  const selection = container.ownerDocument.getSelection();
  const node = selection?.focusNode;

  if (!selection || !node || !container.contains(node)) {
    return null;
  }

  const range = container.ownerDocument.createRange();
  range.setStart(node, selection.focusOffset);
  range.collapse(true);
  const [rect] = range.getClientRects();

  if (rect) {
    return rect;
  }

  const element = node instanceof Element ? node : node.parentElement;

  return element?.getBoundingClientRect() ?? null;
};

/**
 * Scrolls `container` just far enough for the caret to sit at least
 * `inset.top` below its top edge and `inset.bottom` above its bottom edge.
 */
export const revealCaret = (container: HTMLElement, inset: CaretInset) => {
  const caret = getCaretRect(container);

  if (!caret) {
    return;
  }

  const bounds = container.getBoundingClientRect();
  const below = caret.bottom - (bounds.bottom - inset.bottom);
  const above = bounds.top + inset.top - caret.top;

  if (below > 0) {
    container.scrollTop += below;
  }
  else if (above > 0) {
    container.scrollTop -= above;
  }
};
