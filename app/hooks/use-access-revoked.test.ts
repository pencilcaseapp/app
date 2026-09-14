import type { HocuspocusProvider } from '@hocuspocus/provider';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LiveCloseReason } from '~/constants/live';
import { useAccessRevoked } from './use-access-revoked';

function fakeProvider() {
  const callbacks = new Map<string, Set<(payload?: unknown) => void>>();
  const providerMap = new Map<string, unknown>();
  const provider = {
    effectiveName: 'doc-1',
    configuration: { websocketProvider: { configuration: { providerMap } } },
    providerMap,
    detach: vi.fn(() => {
      // The real detach sends a close for a provider still in the map.
      if (providerMap.has('doc-1')) {
        provider.closeSent = true;
      }
    }),
    closeSent: false,
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
  providerMap.set('doc-1', provider);

  return provider;
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

  it('should let go of the provider without a close of its own', () => {
    const provider = fakeProvider();
    const onAccessRevoked = vi.fn(() => {
      expect(provider.detach).toHaveBeenCalledTimes(1);
    });
    renderAccessRevoked(provider, onAccessRevoked);

    provider.emit('close', {
      event: { code: 1000, reason: LiveCloseReason.AccessRevoked },
    });

    expect(onAccessRevoked).toHaveBeenCalledTimes(1);
    expect(provider.providerMap.has('doc-1')).toBe(false);
    expect(provider.closeSent).toBe(false);
  });

  it('should ignore a connection that closed for another reason', () => {
    const provider = fakeProvider();
    const onAccessRevoked = vi.fn();
    renderAccessRevoked(provider, onAccessRevoked);

    provider.emit('close', {
      event: { code: 1006, reason: 'Reset Connection' },
    });

    expect(onAccessRevoked).not.toHaveBeenCalled();
    expect(provider.detach).not.toHaveBeenCalled();
  });

  it('should report a rejected reconnect', () => {
    const provider = fakeProvider();
    const onAccessRevoked = vi.fn();
    renderAccessRevoked(provider, onAccessRevoked);

    provider.emit('authenticationFailed', { reason: 'Forbidden' });

    expect(onAccessRevoked).toHaveBeenCalledTimes(1);
    expect(provider.detach).toHaveBeenCalledTimes(1);
    expect(provider.closeSent).toBe(false);
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
