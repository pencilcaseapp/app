import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFaviconColorScheme } from './use-favicon-color-scheme';

const listeners = new Set<(event: MediaQueryListEvent) => void>();

const changeScheme = (matches: boolean) =>
  listeners.forEach(listener => listener({ matches } as MediaQueryListEvent));

const iconHref = () =>
  document
    .querySelector('link[rel="icon"][type="image/svg+xml"]')
    ?.getAttribute('href');

beforeEach(() => {
  document.head.innerHTML
    = '<link rel="icon" type="image/svg+xml" href="/favicon.svg">';

  vi.stubGlobal('matchMedia', (media: string) => ({
    media,
    matches: false,
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.add(listener),
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
  }));
});

afterEach(() => {
  listeners.clear();
  vi.unstubAllGlobals();
  document.head.innerHTML = '';
});

describe('useFaviconColorScheme', () => {
  it('should leave the icon alone until the scheme changes', () => {
    renderHook(() => useFaviconColorScheme());

    expect(iconHref()).toBe('/favicon.svg');
  });

  it('should swap in the dark icon when the scheme turns dark', () => {
    renderHook(() => useFaviconColorScheme());

    changeScheme(true);

    expect(iconHref()).toBe('/favicon-dark.svg');
  });

  it('should swap back when the scheme turns light again', () => {
    renderHook(() => useFaviconColorScheme());

    changeScheme(true);
    changeScheme(false);

    expect(iconHref()).toBe('/favicon.svg');
  });

  it('should ignore a document without an svg icon', () => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.ico">';
    renderHook(() => useFaviconColorScheme());

    changeScheme(true);

    expect(document.querySelector('link[rel="icon"]')?.getAttribute('href'))
      .toBe('/favicon.ico');
  });

  it('should stop listening once unmounted', () => {
    const { unmount } = renderHook(() => useFaviconColorScheme());

    unmount();

    expect(listeners.size).toBe(0);
  });
});
