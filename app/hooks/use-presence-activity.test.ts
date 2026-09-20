import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import { PRESENCE_HIDDEN_GRACE_MS } from '~/constants/presence';
import type { PresenceAwarenessData } from '~/utils/presence';
import { usePresenceActivity } from './use-presence-activity';

function createProvider() {
  const setAwarenessField = vi.fn();

  return {
    setAwarenessField,
    provider: { setAwarenessField } as unknown as HocuspocusProvider,
  };
}

function setHidden(hidden: boolean) {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(hidden);

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

  it('should publish the page in front of somebody as active', () => {
    const { provider, setAwarenessField } = createProvider();

    renderHook(() => usePresenceActivity(provider, awarenessData));

    expect(awarenessData.isActive).toBe(true);
    expect(setAwarenessField)
      .toHaveBeenCalledWith('awarenessData', awarenessData);
  });

  it('should keep a tab that stays in front, untouched', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    wait(PRESENCE_HIDDEN_GRACE_MS * 10);

    expect(awarenessData.isActive).toBe(true);
  });

  it('should hold somebody who switches to another tab', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    setHidden(true);
    wait(PRESENCE_HIDDEN_GRACE_MS - 1);

    expect(awarenessData.isActive).toBe(true);
  });

  it('should drop a tab hidden for the whole grace', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    setHidden(true);
    wait(PRESENCE_HIDDEN_GRACE_MS);

    expect(awarenessData.isActive).toBe(false);
  });

  it('should keep somebody who comes back within the grace', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    setHidden(true);
    wait(PRESENCE_HIDDEN_GRACE_MS - 1);
    setHidden(false);
    wait(PRESENCE_HIDDEN_GRACE_MS * 10);

    expect(awarenessData.isActive).toBe(true);
  });

  it('should bring back somebody who opens the tab again', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    setHidden(true);
    wait(PRESENCE_HIDDEN_GRACE_MS);
    setHidden(false);

    expect(awarenessData.isActive).toBe(true);
  });

  it('should start on the grace for a page that loads hidden', () => {
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    const { provider } = createProvider();

    renderHook(() => usePresenceActivity(provider, awarenessData));
    wait(PRESENCE_HIDDEN_GRACE_MS);

    expect(awarenessData.isActive).toBe(false);
  });

  it('should keep the object Lexical holds rather than replace it', () => {
    const { provider, setAwarenessField } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    setHidden(true);
    wait(PRESENCE_HIDDEN_GRACE_MS);

    expect(setAwarenessField.mock.calls.map(([, value]) => value))
      .toEqual([awarenessData, awarenessData]);
  });

  it('should stop watching the page when unmounted', () => {
    const { provider, setAwarenessField } = createProvider();
    const { unmount } = renderHook(
      () => usePresenceActivity(provider, awarenessData),
    );

    setHidden(true);
    unmount();
    setAwarenessField.mockClear();
    wait(PRESENCE_HIDDEN_GRACE_MS);

    expect(setAwarenessField).not.toHaveBeenCalled();
  });
});
