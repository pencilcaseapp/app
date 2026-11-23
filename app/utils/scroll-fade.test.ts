import { describe, expect, test } from 'vitest';
import { scrollFadeSize } from './scroll-fade';

describe('scrollFadeSize', () => {
  test('has no fade while nothing is behind the edge', () => {
    expect(scrollFadeSize(0, 16)).toBe('0px');
    expect(scrollFadeSize(1, 16)).toBe('0px');
  });

  test('grows with the content behind the edge', () => {
    expect(scrollFadeSize(7.6, 16)).toBe('8px');
  });

  test('stops at its full size', () => {
    expect(scrollFadeSize(200, 16)).toBe('16px');
  });
});
