import { beforeEach, expect, test, vi } from 'vitest';
import { renderRoute } from '~/utils/testing';

const redirectMock = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    redirect: (url: string, init?: number | ResponseInit) => {
      redirectMock(url);
      return actual.redirect(url, init);
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

test('redirects to new doc', async () => {
  await renderRoute('/home');

  expect(redirectMock).toHaveBeenCalledWith('/new');
});
