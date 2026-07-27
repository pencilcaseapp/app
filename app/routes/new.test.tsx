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

const createDocumentMock = vi.fn();
vi.mock('~/repos/document', async () => ({
  createDocument: (...args: unknown[]) => createDocumentMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('creates a new document and redirects', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, null);

  createDocumentMock.mockResolvedValue({
    ...documentFixture,
    id: 'abd-def-123',
  });

  await renderRoute('/new', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith(
    href('/doc/:id', { id: 'abd-def-123' }),
  );
});

test('sets document owner if user is logged in', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  createDocumentMock.mockResolvedValue(documentFixture);

  await renderRoute('/new', {
    params: {},
    context,
  });

  expect(createDocumentMock).toHaveBeenCalledWith({
    userId: userFixture.id,
  });
});
