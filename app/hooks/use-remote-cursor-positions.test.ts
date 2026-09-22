import { describe, expect, it, vi } from 'vitest';
import {
  getEmptyLineCaretRect,
  placeEmptyLineCarets,
  type CursorRect,
} from './use-remote-cursor-positions';

function rect(top: number, left: number, height: number): CursorRect {
  return { top, left, height };
}

describe('getEmptyLineCaretRect', () => {
  it('leaves a caret the browser could measure alone', () => {
    expect(getEmptyLineCaretRect({ height: 17 }, [rect(99, 40, 17)]))
      .toBeNull();
  });

  it('falls back to the line box of an empty line', () => {
    expect(getEmptyLineCaretRect({ height: 0 }, [rect(99, 40, 17)]))
      .toEqual(rect(99, 40, 17));
  });

  it('takes the last line of a selection ending on an empty line', () => {
    const rects = [rect(51, 73, 17), rect(75, 40, 17), rect(99, 40, 17)];

    expect(getEmptyLineCaretRect({ height: 0 }, rects))
      .toEqual(rect(99, 40, 17));
  });

  it('gives up when there is nothing to measure at all', () => {
    expect(getEmptyLineCaretRect({ height: 0 }, [])).toBeNull();
    expect(getEmptyLineCaretRect({ height: 0 }, [rect(0, 0, 0)])).toBeNull();
  });
});

function createBinding(rects: CursorRect[], caretHeight: number) {
  const container = document.createElement('div');
  const caret = document.createElement('span');

  document.body.appendChild(container);
  container.appendChild(caret);

  // happy-dom measures nothing, so the range answers with the boxes a
  // browser would have reported for the line it covers.
  const range = document.createRange();

  vi.spyOn(range, 'getClientRects')
    .mockReturnValue(rects as unknown as DOMRectList);
  vi.spyOn(range, 'cloneRange').mockReturnValue({
    collapse: () => {},
    getBoundingClientRect: () => ({ height: caretHeight }),
  } as unknown as Range);

  const highlight = new Set([range]);

  Object.defineProperty(container, 'offsetParent', {
    value: document.body,
  });
  vi.spyOn(document.body, 'getBoundingClientRect')
    .mockReturnValue({ left: 10, top: 20 } as DOMRect);

  return {
    binding: {
      cursors: new Map([[1, { selection: { caret, highlight } }]]),
      cursorsContainer: container,
    },
    caret,
  };
}

describe('placeEmptyLineCarets', () => {
  it('moves a caret on an empty line onto that line', () => {
    const { binding, caret } = createBinding([rect(99, 40, 17)], 0);

    placeEmptyLineCarets(binding as never);

    expect(caret.style.top).toBe('79px');
    expect(caret.style.left).toBe('30px');
    expect(caret.style.height).toBe('17px');
  });

  it('leaves a caret Lexical could place alone', () => {
    const { binding, caret } = createBinding([rect(99, 40, 17)], 17);

    placeEmptyLineCarets(binding as never);

    expect(caret.style.top).toBe('');
    expect(caret.style.left).toBe('');
  });

  it('writes nothing once a caret is where it belongs', () => {
    const { binding, caret } = createBinding([rect(99, 40, 17)], 0);

    placeEmptyLineCarets(binding as never);

    const write = vi.spyOn(caret.style, 'setProperty');
    placeEmptyLineCarets(binding as never);

    expect(write).not.toHaveBeenCalled();
  });
});
