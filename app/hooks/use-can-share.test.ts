import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCanShare } from './use-can-share';

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
});

describe('useCanShare', () => {
  test('is false without the Web Share API', () => {
    const { result } = renderHook(() => useCanShare());

    expect(result.current).toBe(false);
  });

  test('is true once the Web Share API is available', () => {
    Object.defineProperty(navigator, 'share', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useCanShare());

    expect(result.current).toBe(true);
  });
});
