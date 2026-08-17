import { afterEach, vi } from 'vitest';
import '~/app.css';
import '@testing-library/jest-dom/vitest';

// `input-otp` schedules timeouts it never clears on unmount, so they can fire
// after happy-dom tore the window down and take the whole run with them
// ("window is not defined"). Cancel whatever a test leaves behind.
const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
const nativeSetTimeout = globalThis.setTimeout;

globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
  const timeout = nativeSetTimeout(...args);
  pendingTimeouts.add(timeout);
  return timeout;
}) as typeof setTimeout;

afterEach(() => {
  pendingTimeouts.forEach(clearTimeout);
  pendingTimeouts.clear();
});

vi.mock('~/utils/csrf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/utils/csrf')>();
  return {
    ...actual,
    csrf: {
      ...actual.csrf,
      validate: () => null,
    },
  };
});
