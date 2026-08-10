import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
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

const getDocumentMock = vi.fn();
vi.mock('~/repos/document', async () => ({
  getDocument: (id: string) => getDocumentMock(id),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders not found state', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue(null);

  const { findByText } = await renderRoute('/doc/:id', {
    params: {
      id: documentFixture.id,
    },
    context,
  });

  expect(await findByText('Not Found')).toBeInTheDocument();
});

test('renders permission denied state', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    userId: 'different-user-id',
  });

  const { findByText } = await renderRoute('/doc/:id', {
    params: {
      id: documentFixture.id,
    },
    context,
  });

  expect(await findByText('Permission Denied')).toBeInTheDocument();
});
