import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    launchOptions: {
      // Claude Code on the web ships its own Chromium build and routes
      // outbound traffic through a TLS-re-signing egress proxy; both
      // variables stay unset everywhere else.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
      args: process.env.PLAYWRIGHT_CHROMIUM_PROXY
        ? [
            `--proxy-server=${process.env.PLAYWRIGHT_CHROMIUM_PROXY}`,
            '--proxy-bypass-list=localhost;127.0.0.1',
            '--ignore-certificate-errors',
            // The egress relay cannot digest Chromium's TLS 1.3
            // client hello (the post-quantum key share).
            '--ssl-version-max=tls1.2',
          ]
        : [],
    },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
