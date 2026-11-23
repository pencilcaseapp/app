/*
 * Browsers draw a favicon once and keep it, so a media query inside the SVG
 * misses a switch between light and dark mode. Like GitHub, this swaps the
 * icon's address instead, before the first paint and on every switch.
 */
export const FAVICON_SCRIPT = `(() => {
  const icon = document.querySelector('link[rel=icon][type="image/svg+xml"]');
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const update = () => {
    icon.href = dark.matches ? '/favicon-dark.svg' : '/favicon.svg';
  };
  update();
  dark.addEventListener('change', update);
})();`;
