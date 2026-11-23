import { href, RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { documentFixture } from '~/test/fixtures/document';
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
vi.mock('~/services/document', async () => ({
  getDocumentList: (userId: string) => getDocumentListMock(userId),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('redirects to new doc if user session exists but no documents', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);
  getDocumentListMock.mockResolvedValue([]);

  await renderRoute('/', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith('/new');
});

test('redirects to last updated doc if user session exists', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);
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

  await renderRoute('/', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith(
    href('/doc/:id', { id: 'doc-1' }),
  );
});

test('hands its search params on to the document it opens', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);
  getDocumentListMock.mockResolvedValue([{ ...documentFixture, id: 'doc-1' }]);

  await renderRoute('/', {
    params: {},
    context,
    searchParams: { toastSuccess: 'Welcome back' },
  });

  expect(redirectMock).toHaveBeenCalledWith('/doc/doc-1?toastSuccess=Welcome+back');
});
