/*
 * Browsers draw a favicon once and keep it, so a media query inside the SVG
 * misses a switch between light and dark mode. This adds the SVG icon itself
 * and swaps its address, before the first paint and on every switch. React
 * must not render that link: hydration would put back a second one with the
 * light address, which browsers then prefer.
 */
export const FAVICON_SCRIPT = `(() => {
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/svg+xml';
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const update = () => {
    icon.href = dark.matches ? '/favicon-dark.svg' : '/favicon.svg';
  };
  update();
  document.head.append(icon);
  dark.addEventListener('change', update);
})();`;
