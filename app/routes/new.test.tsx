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

const createDocumentMock = vi.fn();
vi.mock('~/services/document', async () => ({
  CreateDocumentError: { LimitReached: 0 },
  createDocument: (...args: unknown[]) => createDocumentMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('creates a new document and redirects', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  createDocumentMock.mockResolvedValue([null, {
    ...documentFixture,
    id: 'abd-def-123',
  }]);

  await renderRoute('/new', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith(
    href('/doc/:id', { id: 'abd-def-123' }),
  );
});

test('creates the document for the signed in user', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);
  createDocumentMock.mockResolvedValue([null, documentFixture]);

  await renderRoute('/new', {
    params: {},
    context,
  });

  expect(createDocumentMock).toHaveBeenCalledWith(userFixture);
});

test('redirects to the upgrade once the free limit is reached', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);
  createDocumentMock.mockResolvedValue([0]);

  await renderRoute('/new', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith(href('/upgrade'));
});
