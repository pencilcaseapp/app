import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { useIsHydrated } from './use-is-hydrated';

describe('useIsHydrated', () => {
  test('is false while server rendering', () => {
    const Probe = () => String(useIsHydrated());

    expect(renderToString(createElement(Probe))).toBe('false');
  });

  test('is false while hydrating, then true', () => {
    const container = document.createElement('div');
    container.innerHTML = 'false';
    const values: boolean[] = [];

    renderHook(() => {
      const isHydrated = useIsHydrated();
      values.push(isHydrated);
      return isHydrated;
    }, { container, hydrate: true });

    expect(values[0]).toBe(false);
    expect(values.at(-1)).toBe(true);
  });

  test('is true from the first render of a client-side mount', () => {
    const values: boolean[] = [];

    renderHook(() => {
      const isHydrated = useIsHydrated();
      values.push(isHydrated);
      return isHydrated;
    });

    expect(values).not.toContain(false);
  });
});
