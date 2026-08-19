import { describe, expect, it } from 'vitest';
import { getCursorNameOffset } from './use-cursor-name-bounds';

const VIEWPORT_WIDTH = 1000;
const MARGIN = 8;

function offset(left: number, width: number): number {
  return getCursorNameOffset(
    { left, right: left + width },
    VIEWPORT_WIDTH,
    MARGIN,
  );
}

describe('getCursorNameOffset', () => {
  it('leaves a tag with room on both sides alone', () => {
    expect(offset(400, 60)).toBe(0);
  });

  it('pulls a tag hanging off the right edge back in', () => {
    expect(offset(960, 60)).toBe(-28);
  });

  it('pushes a tag hanging off the left edge back in', () => {
    expect(offset(-10, 60)).toBe(18);
  });

  it('stops at the margin rather than at the edge itself', () => {
    expect(offset(VIEWPORT_WIDTH - 60, 60)).toBe(-MARGIN);
    expect(offset(0, 60)).toBe(MARGIN);
  });

  it('keeps a tag wider than the window pinned to the left', () => {
    expect(offset(MARGIN, VIEWPORT_WIDTH)).toBe(0);
  });
});
