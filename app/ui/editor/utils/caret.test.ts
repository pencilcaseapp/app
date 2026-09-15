import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { revealCaret } from './caret';

const INSET = { top: 60, bottom: 24 };

const rect = (top: number, height: number) =>
  new DOMRect(0, top, 100, height);

let container: HTMLElement;
let paragraph: HTMLElement;
let text: Text;

const setCaretRect = (value: DOMRect | null) => {
  vi.spyOn(Range.prototype, 'getClientRects').mockReturnValue(
    (value ? [value] : []) as unknown as DOMRectList,
  );
};

const placeCaret = (node: Node, offset = 0) => {
  const selection = document.getSelection();
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
};

describe('revealCaret', () => {
  beforeEach(() => {
    container = document.createElement('div');
    paragraph = document.createElement('p');
    text = document.createTextNode('Hello');
    paragraph.append(text);
    container.append(paragraph);
    document.body.append(container);
    container.scrollTop = 500;
    vi.spyOn(container, 'getBoundingClientRect')
      .mockReturnValue(rect(0, 400));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.getSelection()?.removeAllRanges();
    document.body.innerHTML = '';
  });

  it('should leave a caret that is already in view alone', () => {
    placeCaret(text, 2);
    setCaretRect(rect(200, 24));

    revealCaret(container, INSET);

    expect(container.scrollTop).toBe(500);
  });

  it('should scroll down to lift the caret clear of the bottom edge', () => {
    placeCaret(text, 2);
    setCaretRect(rect(420, 24));

    revealCaret(container, INSET);

    expect(container.scrollTop).toBe(500 + 420 + 24 - (400 - 24));
  });

  it('should scroll up to bring the caret out from under the top', () => {
    placeCaret(text, 2);
    setCaretRect(rect(20, 24));

    revealCaret(container, INSET);

    expect(container.scrollTop).toBe(500 - (60 - 20));
  });

  it('should fall back to the block of a caret without a rect', () => {
    placeCaret(paragraph, 0);
    setCaretRect(null);
    vi.spyOn(paragraph, 'getBoundingClientRect')
      .mockReturnValue(rect(420, 24));

    revealCaret(container, INSET);

    expect(container.scrollTop).toBe(500 + 420 + 24 - (400 - 24));
  });

  it('should ignore a selection outside the container', () => {
    const outside = document.createElement('p');
    document.body.append(outside);
    placeCaret(outside, 0);
    setCaretRect(rect(420, 24));

    revealCaret(container, INSET);

    expect(container.scrollTop).toBe(500);
  });

  it('should do nothing without a selection', () => {
    setCaretRect(rect(420, 24));

    revealCaret(container, INSET);

    expect(container.scrollTop).toBe(500);
  });
});
