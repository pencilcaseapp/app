import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react()],
  test: {
    globals: true,
    env: {
      ENV: 'test',
    },
    environment: 'happy-dom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    setupFiles: ['test/setup.ts'],
    globalSetup: ['test/global-setup.ts'],
  },
});
