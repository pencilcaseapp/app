import { useEffect } from 'react';

const svgIconSelector = 'link[rel="icon"][type="image/svg+xml"]';

/**
 * Browsers rasterise a favicon once and never re-read the
 * prefers-color-scheme query inside it, so switching the system theme leaves
 * a stale icon in the tab until the next page load. Pointing the link at a
 * file whose fill is hard coded swaps the icon right away.
 */
export function useFaviconColorScheme() {
  useEffect(() => {
    const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    const swapIcon = ({ matches }: MediaQueryListEvent) => {
      const icon = document.querySelector<HTMLLinkElement>(svgIconSelector);

      icon?.setAttribute(
        'href',
        matches ? '/favicon-dark.svg' : '/favicon.svg',
      );
    };

    darkScheme.addEventListener('change', swapIcon);

    return () => darkScheme.removeEventListener('change', swapIcon);
  }, []);
}
