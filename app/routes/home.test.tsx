import { href, RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { documentFixture } from '~/test/fixtures/doucment';
import { userFixture } from '~/test/fixtures/user';
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

const getDocumentListMock = vi.fn();
vi.mock('~/repos/document', async () => ({
  getDocumentList: (userId: string) => getDocumentListMock(userId),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('redirects to new doc if no user session exists', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, null);

  await renderRoute('/home', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith('/new');
});

test('redirects to new doc if user session exists but no documents', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentListMock.mockResolvedValue([]);

  await renderRoute('/home', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith('/new');
});

test('redirects to last updated doc if user session exists', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentListMock.mockResolvedValue([
    {
      ...documentFixture,
      id: 'doc-1',
    },
    {
      ...documentFixture,
      id: 'doc-2',
    },
  ]);

  await renderRoute('/home', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith(
    href('/doc/:id', { id: 'doc-1' }),
  );
});
