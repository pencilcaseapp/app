import { vi } from 'vitest';
import '~/app.css';
import '@testing-library/jest-dom/vitest';

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
