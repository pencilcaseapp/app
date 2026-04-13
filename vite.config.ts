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
  optimizeDeps: {
    entries: [
      'app/routes/*.tsx',
    ],
  },
});
