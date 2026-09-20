import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import { PRESENCE_IDLE_TIMEOUT_MS } from '~/constants/presence';
import type { PresenceAwarenessData } from '~/utils/presence';
import { usePresenceActivity } from './use-presence-activity';

function createProvider() {
  const setAwarenessField = vi.fn();

  return {
    setAwarenessField,
    provider: { setAwarenessField } as unknown as HocuspocusProvider,
  };
}

function hideTab() {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);

  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('usePresenceActivity', () => {
  let awarenessData: PresenceAwarenessData;

  beforeEach(() => {
    vi.useFakeTimers();
    awarenessData = { presenceId: 'grace', isActive: true };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should publish somebody on the page as active', () => {
    const { provider, setAwarenessField } = createProvider();

    renderHook(() => usePresenceActivity(provider, awarenessData));

    expect(awarenessData.isActive).toBe(true);
    expect(setAwarenessField)
      .toHaveBeenCalledWith('awarenessData', awarenessData);
  });

  it('should go away after the timeout with nothing happening', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    wait(PRESENCE_IDLE_TIMEOUT_MS);

    expect(awarenessData.isActive).toBe(false);
  });

  it('should stay while the page is being used', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    wait(PRESENCE_IDLE_TIMEOUT_MS - 1);
    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    wait(PRESENCE_IDLE_TIMEOUT_MS - 1);

    expect(awarenessData.isActive).toBe(true);
  });

  it('should hold somebody who switches to another tab', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    wait(PRESENCE_IDLE_TIMEOUT_MS - 1);
    hideTab();
    wait(PRESENCE_IDLE_TIMEOUT_MS - 1);

    expect(awarenessData.isActive).toBe(true);
  });

  it('should drop a tab hidden for the whole timeout', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    hideTab();
    wait(PRESENCE_IDLE_TIMEOUT_MS);

    expect(awarenessData.isActive).toBe(false);
  });

  it('should come back when the tab is opened again', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    hideTab();
    wait(PRESENCE_IDLE_TIMEOUT_MS);
    act(() => {
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(awarenessData.isActive).toBe(true);
  });

  it('should keep the object Lexical holds rather than replace it', () => {
    const { provider, setAwarenessField } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    wait(PRESENCE_IDLE_TIMEOUT_MS);

    expect(setAwarenessField.mock.calls.map(([, value]) => value))
      .toEqual([awarenessData, awarenessData]);
  });

  it('should stop watching the page when unmounted', () => {
    const { provider, setAwarenessField } = createProvider();
    const { unmount } = renderHook(
      () => usePresenceActivity(provider, awarenessData),
    );

    unmount();
    setAwarenessField.mockClear();
    wait(PRESENCE_IDLE_TIMEOUT_MS);

    expect(setAwarenessField).not.toHaveBeenCalled();
  });
});
