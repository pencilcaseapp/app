import type { HocuspocusProvider } from '@hocuspocus/provider';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLiveAccess } from './use-live-access';

function fakeProvider(hasUnsyncedChanges = false) {
  const callbacks = new Map<string, Set<(payload?: unknown) => void>>();

  return {
    hasUnsyncedChanges,
    on(event: string, fn: (payload?: unknown) => void) {
      callbacks.set(event, (callbacks.get(event) ?? new Set()).add(fn));
    },
    off(event: string, fn: (payload?: unknown) => void) {
      callbacks.get(event)?.delete(fn);
    },
    emit(event: string, payload?: unknown) {
      callbacks.get(event)?.forEach(fn => fn(payload));
    },
  };
}

function renderLiveAccess(
  provider: ReturnType<typeof fakeProvider>,
  onAccessChanged: (access: { readOnly: boolean; stale: boolean }) => void,
) {
  return renderHook(() => useLiveAccess(
    provider as unknown as HocuspocusProvider,
    onAccessChanged,
  ));
}

function accessMessage(readOnly: boolean) {
  return { payload: JSON.stringify({ type: 'access', readOnly }) };
}

describe('useLiveAccess', () => {
  it('should report the access the server switched to', () => {
    const provider = fakeProvider();
    const onAccessChanged = vi.fn();
    renderLiveAccess(provider, onAccessChanged);

    provider.emit('stateless', accessMessage(true));
    provider.emit('stateless', accessMessage(false));

    expect(onAccessChanged).toHaveBeenNthCalledWith(1, {
      readOnly: true,
      stale: false,
    });
    expect(onAccessChanged).toHaveBeenNthCalledWith(2, {
      readOnly: false,
      stale: false,
    });
  });

  it('should flag a switch to read-only that left an edit behind', () => {
    const provider = fakeProvider(true);
    const onAccessChanged = vi.fn();
    renderLiveAccess(provider, onAccessChanged);

    provider.emit('stateless', accessMessage(true));

    expect(onAccessChanged).toHaveBeenCalledWith({
      readOnly: true,
      stale: true,
    });
  });

  it('should not flag a switch to write', () => {
    const provider = fakeProvider(true);
    const onAccessChanged = vi.fn();
    renderLiveAccess(provider, onAccessChanged);

    provider.emit('stateless', accessMessage(false));

    expect(onAccessChanged).toHaveBeenCalledWith({
      readOnly: false,
      stale: false,
    });
  });

  it('should ignore other stateless messages', () => {
    const provider = fakeProvider();
    const onAccessChanged = vi.fn();
    renderLiveAccess(provider, onAccessChanged);

    provider.emit('stateless', { payload: 'not json' });
    provider.emit('stateless', { payload: JSON.stringify({ type: 'other' }) });
    provider.emit('stateless', {
      payload: JSON.stringify({ type: 'access', readOnly: 'yes' }),
    });

    expect(onAccessChanged).not.toHaveBeenCalled();
  });

  it('should stop listening when unmounted', () => {
    const provider = fakeProvider();
    const onAccessChanged = vi.fn();
    const { unmount } = renderLiveAccess(provider, onAccessChanged);

    unmount();
    provider.emit('stateless', accessMessage(true));

    expect(onAccessChanged).not.toHaveBeenCalled();
  });
});
