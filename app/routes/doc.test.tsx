import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { OpenDocumentError } from '~/services/document';
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

const openDocumentMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual as object,
    openDocument: (...args: unknown[]) => openDocumentMock(...args),
  };
});

const documentUrl = `/doc/${documentFixture.id}`;

beforeEach(() => {
  vi.clearAllMocks();
});

function renderDoc(context: RouterContextProvider) {
  return renderRoute('/doc/:id', {
    params: { id: documentFixture.id },
    context,
  });
}

function openedDocument(overrides?: Partial<{
  isOwner: boolean;
  shared: boolean;
  hasJoined: boolean;
}>) {
  return [null, {
    title: documentFixture.title,
    shared: false,
    isOwner: true,
    hasJoined: false,
    ...overrides,
  }];
}

test('opens the document for the signed in viewer', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock.mockResolvedValue(openedDocument());

  const { queryByText } = await renderDoc(context);

  expect(openDocumentMock)
    .toHaveBeenCalledWith(documentFixture.id, userFixture.id);
  expect(queryByText('Permission Denied')).not.toBeInTheDocument();
  expect(redirectMock).not.toHaveBeenCalled();
});

test('renders not found state', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock.mockResolvedValue([OpenDocumentError.NotFound]);

  const { findByText } = await renderDoc(context);

  expect(await findByText('Not Found')).toBeInTheDocument();
});

test('renders permission denied state', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock.mockResolvedValue([OpenDocumentError.PermissionDenied]);

  const { findByText } = await renderDoc(context);

  expect(await findByText('Permission Denied')).toBeInTheDocument();
});

test('sends an anonymous visitor to sign in', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, null);
  openDocumentMock.mockResolvedValue([OpenDocumentError.PermissionDenied]);

  await renderDoc(context);

  await vi.waitFor(() => {
    expect(redirectMock)
      .toHaveBeenCalledWith(`/signin?returnUrl=${encodeURIComponent(documentUrl)}`);
  });
});

test('redirects a visitor who just joined to refresh the nav', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock
    .mockResolvedValueOnce(
      openedDocument({ isOwner: false, shared: true, hasJoined: true }),
    )
    .mockResolvedValue(openedDocument({ isOwner: false, shared: true }));

  await renderDoc(context);

  await vi.waitFor(() => {
    expect(redirectMock).toHaveBeenCalledWith(documentUrl);
  });
});

test('lets an anonymous visitor read a shared document', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, null);
  openDocumentMock.mockResolvedValue(
    openedDocument({ isOwner: false, shared: true }),
  );

  const { queryByText } = await renderDoc(context);

  expect(openDocumentMock)
    .toHaveBeenCalledWith(documentFixture.id, undefined);
  expect(queryByText('Permission Denied')).not.toBeInTheDocument();
  expect(redirectMock).not.toHaveBeenCalled();
});
