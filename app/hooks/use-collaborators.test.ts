import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type {
  HocuspocusProvider,
  StatesArray,
} from '@hocuspocus/provider';
import { useCollaborators } from './use-collaborators';

const LOCAL_CLIENT_ID = 1;

function createProvider() {
  const listeners = new Set<(payload: { states: StatesArray }) => void>();

  const provider = {
    document: { clientID: LOCAL_CLIENT_ID },
    on: (_event: string, callback: (p: { states: StatesArray }) => void) => {
      listeners.add(callback);
    },
    off: (_event: string, callback: (p: { states: StatesArray }) => void) => {
      listeners.delete(callback);
    },
  } as unknown as HocuspocusProvider;

  const changeAwareness = (states: StatesArray) =>
    act(() => {
      listeners.forEach(callback => callback({ states }));
    });

  return { provider, changeAwareness, listeners };
}

describe('useCollaborators', () => {
  it('should start empty', () => {
    const { provider } = createProvider();

    const { result } = renderHook(() => useCollaborators(provider));

    expect(result.current).toEqual([]);
  });

  it('should report somebody joining, without the local user', () => {
    const { provider, changeAwareness } = createProvider();
    const { result } = renderHook(() => useCollaborators(provider));

    changeAwareness([
      { clientId: LOCAL_CLIENT_ID, name: 'Ada', color: '#2563EB' },
      {
        clientId: 2,
        name: 'Grace',
        color: '#DB2777',
        awarenessData: { presenceId: 'grace', isActive: true },
      },
    ]);

    expect(result.current).toEqual([
      { id: 'grace', name: 'Grace', color: '#DB2777', isActive: true },
    ]);
  });

  it('should report somebody leaving', () => {
    const { provider, changeAwareness } = createProvider();
    const { result } = renderHook(() => useCollaborators(provider));

    changeAwareness([
      { clientId: LOCAL_CLIENT_ID, name: 'Ada', color: '#2563EB' },
      { clientId: 2, name: 'Grace', color: '#DB2777' },
    ]);
    changeAwareness([
      { clientId: LOCAL_CLIENT_ID, name: 'Ada', color: '#2563EB' },
    ]);

    expect(result.current).toEqual([]);
  });

  it('should follow somebody leaving the page they had open', () => {
    const { provider, changeAwareness } = createProvider();
    const { result } = renderHook(() => useCollaborators(provider));
    const grace = (isActive: boolean) => ({
      clientId: 2,
      name: 'Grace',
      color: '#DB2777',
      awarenessData: { presenceId: 'grace', isActive },
    });

    changeAwareness([grace(true)]);
    expect(result.current[0].isActive).toBe(true);

    changeAwareness([grace(false)]);
    expect(result.current[0].isActive).toBe(false);
  });

  it('should stop listening when unmounted', () => {
    const { provider, listeners } = createProvider();
    const { unmount } = renderHook(() => useCollaborators(provider));

    unmount();

    expect(listeners.size).toBe(0);
  });
});
