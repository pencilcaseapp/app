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

function setHidden(hidden: boolean) {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(hidden);

  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
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

  it('should publish a visible page as active', () => {
    const { provider, setAwarenessField } = createProvider();

    renderHook(() => usePresenceActivity(provider, awarenessData));

    expect(awarenessData.isActive).toBe(true);
    expect(setAwarenessField)
      .toHaveBeenCalledWith('awarenessData', awarenessData);
  });

  it('should go away as soon as the tab is hidden', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    setHidden(true);

    expect(awarenessData.isActive).toBe(false);
  });

  it('should come back when the tab is shown again', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    setHidden(true);
    setHidden(false);

    expect(awarenessData.isActive).toBe(true);
  });

  it('should go away after the idle timeout', () => {
    const { provider } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    act(() => {
      vi.advanceTimersByTime(PRESENCE_IDLE_TIMEOUT_MS);
    });

    expect(awarenessData.isActive).toBe(false);
  });

  it('should keep the object Lexical holds rather than replace it', () => {
    const { provider, setAwarenessField } = createProvider();
    renderHook(() => usePresenceActivity(provider, awarenessData));

    setHidden(true);

    expect(setAwarenessField.mock.calls.map(([, value]) => value))
      .toEqual([awarenessData, awarenessData]);
  });
});
