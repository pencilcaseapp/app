import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOBILE_MEDIA_QUERY, useIsMobile } from './use-is-mobile';

const mediaQueryList = new EventTarget() as MediaQueryList;

const setMatches = (matches: boolean) => {
  Object.defineProperty(mediaQueryList, 'matches', {
    value: matches,
    configurable: true,
  });
};

describe('useIsMobile', () => {
  beforeEach(() => {
    setMatches(false);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQueryList));
  });

  it('should query the mobile media query', () => {
    renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith(MOBILE_MEDIA_QUERY);
  });

  it('should report a desktop viewport', () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('should report a mobile viewport', () => {
    setMatches(true);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('should follow the viewport across the breakpoint', () => {
    const { result } = renderHook(() => useIsMobile());

    act(() => {
      setMatches(true);
      mediaQueryList.dispatchEvent(new Event('change'));
    });

    expect(result.current).toBe(true);
  });
});
