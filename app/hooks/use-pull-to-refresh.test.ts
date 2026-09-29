import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePullToRefresh } from './use-pull-to-refresh';

const THRESHOLD = 80;

const setScrollY = (value: number) => {
  Object.defineProperty(window, 'scrollY', { value, configurable: true });
};

const touch = (type: 'touchstart' | 'touchend' | 'touchcancel') => {
  act(() => {
    window.dispatchEvent(new TouchEvent(type, { touches: [] }));
  });
};

const pullTo = (scrollY: number) => {
  setScrollY(scrollY);
  act(() => {
    vi.advanceTimersToNextFrame();
  });
};

const renderPullToRefresh = (enabled = true) => {
  const onRefresh = vi.fn();
  const hook = renderHook(() => usePullToRefresh({
    enabled,
    threshold: THRESHOLD,
    onRefresh,
  }));

  return { ...hook, onRefresh };
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });
  setScrollY(0);
});

afterEach(() => {
  vi.useRealTimers();
  setScrollY(0);
});

describe('usePullToRefresh', () => {
  it('follows the page pulled past its top', () => {
    const { result } = renderPullToRefresh();

    touch('touchstart');
    pullTo(-30);

    expect(result.current).toEqual({
      distance: 30,
      armed: false,
      refreshing: false,
    });
  });

  it('refreshes when let go past the threshold', () => {
    const { result, onRefresh } = renderPullToRefresh();

    touch('touchstart');
    pullTo(-THRESHOLD);
    expect(result.current.armed).toBe(true);
    expect(onRefresh).not.toHaveBeenCalled();

    touch('touchend');
    pullTo(-40);

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.refreshing).toBe(true);
  });

  it('stays armed once the threshold was reached', () => {
    const { onRefresh } = renderPullToRefresh();

    touch('touchstart');
    pullTo(-THRESHOLD);
    pullTo(-50);
    touch('touchend');

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('settles back without refreshing when let go early', () => {
    const { result, onRefresh } = renderPullToRefresh();

    touch('touchstart');
    pullTo(-50);
    touch('touchend');
    pullTo(-20);
    expect(result.current.distance).toBe(20);

    pullTo(0);

    expect(onRefresh).not.toHaveBeenCalled();
    expect(result.current.distance).toBe(0);
  });

  it('ignores a bounce off the top without a finger on the screen', () => {
    const { result, onRefresh } = renderPullToRefresh();

    touch('touchstart');
    touch('touchend');
    pullTo(-THRESHOLD * 2);

    expect(result.current.distance).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    const { result } = renderPullToRefresh(false);

    touch('touchstart');
    pullTo(-THRESHOLD);

    expect(result.current.distance).toBe(0);
  });
});
