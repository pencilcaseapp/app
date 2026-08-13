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
const isDocumentCollaboratorMock = vi.fn();
const connectCollaboratorMock = vi.fn();
vi.mock('~/repos/document', async () => ({
  getDocument: (id: string) => getDocumentMock(id),
  isDocumentCollaborator: (documentId: string, userId: string) =>
    isDocumentCollaboratorMock(documentId, userId),
  connectCollaborator: (input: unknown) => connectCollaboratorMock(input),
}));

const documentUrl = `/doc/${documentFixture.id}`;

beforeEach(() => {
  vi.clearAllMocks();
  isDocumentCollaboratorMock.mockResolvedValue(true);
});

function renderDoc(context: RouterContextProvider) {
  return renderRoute('/doc/:id', {
    params: { id: documentFixture.id },
    context,
  });
}

test('renders not found state', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue(null);

  const { findByText } = await renderDoc(context);

  expect(await findByText('Not Found')).toBeInTheDocument();
});

test('denies access to a private document', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: false,
    userId: 'different-user-id',
  });

  const { findByText } = await renderDoc(context);

  expect(await findByText('Permission Denied')).toBeInTheDocument();
});

test('connects a first-time visitor and redirects to refresh the nav', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: true,
    userId: 'different-user-id',
  });
  isDocumentCollaboratorMock
    .mockResolvedValueOnce(false)
    .mockResolvedValue(true);

  await renderDoc(context);

  await vi.waitFor(() => {
    expect(connectCollaboratorMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      userId: userFixture.id,
    });
    expect(redirectMock).toHaveBeenCalledWith(documentUrl);
  });
});

test('does not reconnect a returning visitor', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: true,
    userId: 'different-user-id',
  });
  isDocumentCollaboratorMock.mockResolvedValue(true);

  const { queryByText } = await renderDoc(context);

  expect(connectCollaboratorMock).not.toHaveBeenCalled();
  expect(redirectMock).not.toHaveBeenCalled();
  expect(queryByText('Permission Denied')).not.toBeInTheDocument();
});

test('lets an anonymous visitor read a shared document', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, null);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: true,
    userId: 'different-user-id',
  });

  const { queryByText } = await renderDoc(context);

  expect(connectCollaboratorMock).not.toHaveBeenCalled();
  expect(queryByText('Permission Denied')).not.toBeInTheDocument();
});
