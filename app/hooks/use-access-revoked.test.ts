import type { HocuspocusProvider } from '@hocuspocus/provider';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LiveCloseReason } from '~/constants/live';
import { useAccessRevoked } from './use-access-revoked';

function fakeProvider() {
  const callbacks = new Map<string, Set<(payload?: unknown) => void>>();

  return {
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

function renderAccessRevoked(
  provider: ReturnType<typeof fakeProvider>,
  onAccessRevoked: () => void,
) {
  return renderHook(() => useAccessRevoked(
    provider as unknown as HocuspocusProvider,
    onAccessRevoked,
  ));
}

describe('useAccessRevoked', () => {
  it('should report a connection the server revoked', () => {
    const provider = fakeProvider();
    const onAccessRevoked = vi.fn();
    renderAccessRevoked(provider, onAccessRevoked);

    provider.emit('close', {
      event: { code: 1000, reason: LiveCloseReason.AccessRevoked },
    });

    expect(onAccessRevoked).toHaveBeenCalledTimes(1);
  });

  it('should ignore a connection that closed for another reason', () => {
    const provider = fakeProvider();
    const onAccessRevoked = vi.fn();
    renderAccessRevoked(provider, onAccessRevoked);

    provider.emit('close', {
      event: { code: 1006, reason: 'Reset Connection' },
    });

    expect(onAccessRevoked).not.toHaveBeenCalled();
  });

  it('should report a rejected reconnect', () => {
    const provider = fakeProvider();
    const onAccessRevoked = vi.fn();
    renderAccessRevoked(provider, onAccessRevoked);

    provider.emit('authenticationFailed', { reason: 'Forbidden' });

    expect(onAccessRevoked).toHaveBeenCalledTimes(1);
  });

  it('should stop listening when unmounted', () => {
    const provider = fakeProvider();
    const onAccessRevoked = vi.fn();
    const { unmount } = renderAccessRevoked(provider, onAccessRevoked);

    unmount();
    provider.emit('close', {
      event: { code: 1000, reason: LiveCloseReason.AccessRevoked },
    });
    provider.emit('authenticationFailed', { reason: 'Forbidden' });

    expect(onAccessRevoked).not.toHaveBeenCalled();
  });
});
