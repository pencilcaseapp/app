import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

const isStorybook = process.argv[1]?.includes('storybook');

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    !isStorybook && reactRouter(),
    devtoolsJson(),
  ],
  css: {
    postcss: {
      plugins: [
        /*
         * The @fontsource packages declare their faces with
         * `font-display: swap`, which draws the text in the fallback font
         * and swaps it once the font is there: a visible jump on any load
         * the font is not cached for. `block` keeps the text back until the
         * font is there instead (three seconds at most).
         */
        {
          postcssPlugin: 'font-display-block',
          AtRule: {
            'font-face': (rule) => {
              rule.walkDecls('font-display', (declaration) => {
                declaration.value = 'block';
              });
            },
          },
        },
      ],
    },
  },
  optimizeDeps: {
    entries: [
      'app/root.tsx',
      'app/layouts/*.tsx',
      'app/routes/*.tsx',
    ],
  },
});
