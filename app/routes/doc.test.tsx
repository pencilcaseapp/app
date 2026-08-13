import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';
import { action, loader } from './doc';

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
const setDocumentSharedMock = vi.fn();
const isDocumentCollaboratorMock = vi.fn();
const removeCollaboratorsForDocumentMock = vi.fn();
vi.mock('~/repos/document', async () => ({
  getDocument: (id: string) => getDocumentMock(id),
  setDocumentShared: (id: string, shared: boolean) =>
    setDocumentSharedMock(id, shared),
  isDocumentCollaborator: (documentId: string, userId: string) =>
    isDocumentCollaboratorMock(documentId, userId),
  removeCollaboratorsForDocument: (id: string) =>
    removeCollaboratorsForDocumentMock(id),
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

test('renders permission denied for a private document', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: false,
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

function callLoader(context: RouterContextProvider) {
  return loader({
    request: new Request(`http://localhost/doc/${documentFixture.id}`),
    params: { id: documentFixture.id },
    context,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

test('flags that a shared-document visitor still needs connecting', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: true,
    userId: 'different-user-id',
  });
  isDocumentCollaboratorMock.mockResolvedValue(false);

  expect(await callLoader(context)).toMatchObject({
    ok: true,
    needsConnect: true,
  });
});

test('does not flag connect once the visitor is a collaborator', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: true,
    userId: 'different-user-id',
  });
  isDocumentCollaboratorMock.mockResolvedValue(true);

  expect(await callLoader(context)).toMatchObject({ needsConnect: false });
});

test('does not flag connect for the owner', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: true,
    userId: userFixture.id,
  });

  expect(await callLoader(context)).toMatchObject({ needsConnect: false });
  expect(isDocumentCollaboratorMock).not.toHaveBeenCalled();
});

function shareRequest(shared: boolean) {
  const formData = new FormData();
  formData.set('shared', String(shared));

  return new Request(`http://localhost/doc/${documentFixture.id}`, {
    method: 'POST',
    body: formData,
  });
}

test('action enables sharing for the owner', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    userId: userFixture.id,
  });

  await action({
    request: shareRequest(true),
    params: { id: documentFixture.id },
    context,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  expect(setDocumentSharedMock).toHaveBeenCalledWith(documentFixture.id, true);
  expect(removeCollaboratorsForDocumentMock).not.toHaveBeenCalled();
});

test('action removes collaborators when unsharing', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    userId: userFixture.id,
  });

  await action({
    request: shareRequest(false),
    params: { id: documentFixture.id },
    context,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  expect(setDocumentSharedMock).toHaveBeenCalledWith(documentFixture.id, false);
  expect(removeCollaboratorsForDocumentMock).toHaveBeenCalledWith(
    documentFixture.id,
  );
});

test('action rejects a non-owner', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    userId: 'different-user-id',
  });

  const thrown = await action({
    request: shareRequest(true),
    params: { id: documentFixture.id },
    context,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any).catch((error: unknown) => error);

  expect(thrown).toMatchObject({ init: { status: 403 } });
  expect(setDocumentSharedMock).not.toHaveBeenCalled();
});
