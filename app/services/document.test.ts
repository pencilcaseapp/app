// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canOpenDocument,
  deleteDocument,
  DeleteDocumentError,
  openDocument,
  OpenDocumentError,
  restoreDocument,
  shareDocument,
  ShareDocumentError,
} from './document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';

const getDocumentForViewerMock = vi.fn();
const connectCollaboratorMock = vi.fn();
const setDocumentSharedMock = vi.fn();
const removeCollaboratorsForDocumentMock = vi.fn();
const softDeleteDocumentMock = vi.fn();
const restoreDocumentRowMock = vi.fn();
vi.mock('~/repos/document', () => ({
  getDocumentForViewer: (...args: unknown[]) =>
    getDocumentForViewerMock(...args),
  connectCollaborator: (...args: unknown[]) => connectCollaboratorMock(...args),
  setDocumentShared: (...args: unknown[]) => setDocumentSharedMock(...args),
  removeCollaboratorsForDocument: (...args: unknown[]) =>
    removeCollaboratorsForDocumentMock(...args),
  softDeleteDocument: (...args: unknown[]) => softDeleteDocumentMock(...args),
  restoreDocument: (...args: unknown[]) => restoreDocumentRowMock(...args),
}));

const closeDocumentConnectionsMock = vi.fn();
vi.mock('~/live/connections', () => ({
  closeDocumentConnections: (...args: unknown[]) =>
    closeDocumentConnectionsMock(...args),
}));

const otherUserId = 'e6d9c8f1-0000-4000-8000-000000000000';

function viewerDocument(overrides?: Partial<{
  shared: boolean;
  userId: string;
  deletedAt: Date | null;
  isCollaborator: boolean;
}>) {
  return {
    id: documentFixture.id,
    title: documentFixture.title,
    shared: false,
    userId: userFixture.id,
    deletedAt: null,
    isCollaborator: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('openDocument', () => {
  it('returns not found for an unknown document', async () => {
    getDocumentForViewerMock.mockResolvedValue(undefined);

    const [error] = await openDocument(documentFixture.id, userFixture.id);

    expect(error).toBe(OpenDocumentError.NotFound);
  });

  it('returns not found for a deleted document, even to its owner', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ deletedAt: new Date() }),
    );

    const [error] = await openDocument(documentFixture.id, userFixture.id);

    expect(error).toBe(OpenDocumentError.NotFound);
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('reads the document and the collaborator status in one query', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    await openDocument(documentFixture.id, userFixture.id);

    expect(getDocumentForViewerMock).toHaveBeenCalledTimes(1);
    expect(getDocumentForViewerMock)
      .toHaveBeenCalledWith(documentFixture.id, userFixture.id);
  });

  it('lets the owner open a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    const [error, document] = await openDocument(
      documentFixture.id, userFixture.id,
    );

    expect(error).toBeNull();
    expect(document).toStrictEqual({
      title: documentFixture.title,
      shared: false,
      isOwner: true,
      hasJoined: false,
    });
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('denies a visitor access to a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId }),
    );

    const [error] = await openDocument(documentFixture.id, userFixture.id);

    expect(error).toBe(OpenDocumentError.PermissionDenied);
  });

  it('denies an anonymous visitor access to a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId }),
    );

    const [error] = await openDocument(documentFixture.id);

    expect(error).toBe(OpenDocumentError.PermissionDenied);
  });

  it('connects a visitor on their first open of a shared document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, shared: true }),
    );

    const [error, document] = await openDocument(
      documentFixture.id, userFixture.id,
    );

    expect(error).toBeNull();
    expect(document?.hasJoined).toBe(true);
    expect(document?.isOwner).toBe(false);
    expect(connectCollaboratorMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      userId: userFixture.id,
    });
  });

  it('does not reconnect a returning visitor', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      shared: true,
      isCollaborator: true,
    }));

    const [, document] = await openDocument(
      documentFixture.id, userFixture.id,
    );

    expect(document?.hasJoined).toBe(false);
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('does not connect an anonymous visitor', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, shared: true }),
    );

    const [error, document] = await openDocument(documentFixture.id);

    expect(error).toBeNull();
    expect(document?.hasJoined).toBe(false);
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });
});

describe('shareDocument', () => {
  it('shares a document for its owner', async () => {
    setDocumentSharedMock.mockResolvedValue({
      id: documentFixture.id,
      shared: true,
    });

    const [error, result] = await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      shared: true,
    });

    expect(error).toBeNull();
    expect(result?.shared).toBe(true);
    expect(setDocumentSharedMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      ownerId: userFixture.id,
      shared: true,
    });
    expect(removeCollaboratorsForDocumentMock).not.toHaveBeenCalled();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });

  it('drops the collaborators when a document is unshared', async () => {
    setDocumentSharedMock.mockResolvedValue({
      id: documentFixture.id,
      shared: false,
    });

    const [error, result] = await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      shared: false,
    });

    expect(error).toBeNull();
    expect(result?.shared).toBe(false);
    expect(removeCollaboratorsForDocumentMock)
      .toHaveBeenCalledWith(documentFixture.id);
  });

  it('disconnects the collaborators editing right now', async () => {
    setDocumentSharedMock.mockResolvedValue({
      id: documentFixture.id,
      shared: false,
    });

    await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      shared: false,
    });

    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      keepUserId: userFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    setDocumentSharedMock.mockResolvedValue(undefined);

    const [error] = await shareDocument({
      documentId: documentFixture.id,
      userId: otherUserId,
      shared: true,
    });

    expect(error).toBe(ShareDocumentError.PermissionDenied);
    expect(removeCollaboratorsForDocumentMock).not.toHaveBeenCalled();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });
});

describe('canOpenDocument', () => {
  it('rejects an unknown document', async () => {
    getDocumentForViewerMock.mockResolvedValue(undefined);

    expect(await canOpenDocument(documentFixture.id, userFixture.id))
      .toBe(false);
  });

  it('rejects a deleted document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ deletedAt: new Date() }),
    );

    expect(await canOpenDocument(documentFixture.id, userFixture.id))
      .toBe(false);
  });

  it('lets the owner into a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    expect(await canOpenDocument(documentFixture.id, userFixture.id))
      .toBe(true);
  });

  it('rejects a visitor of a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId }),
    );

    expect(await canOpenDocument(documentFixture.id, userFixture.id))
      .toBe(false);
  });

  it('lets an anonymous visitor into a shared document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, shared: true }),
    );

    expect(await canOpenDocument(documentFixture.id)).toBe(true);
  });

  it('does not connect a collaborator', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, shared: true }),
    );

    await canOpenDocument(documentFixture.id, userFixture.id);

    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });
});

describe('deleteDocument', () => {
  it('soft deletes a document for its owner', async () => {
    softDeleteDocumentMock.mockResolvedValue({
      id: documentFixture.id,
      deletedAt: new Date(),
    });

    const [error, result] = await deleteDocument(
      documentFixture.id, userFixture.id,
    );

    expect(error).toBeNull();
    expect(result).toStrictEqual({ id: documentFixture.id });
    expect(softDeleteDocumentMock)
      .toHaveBeenCalledWith(documentFixture.id, userFixture.id);
  });

  it('drops the collaborators and closes every connection', async () => {
    softDeleteDocumentMock.mockResolvedValue({
      id: documentFixture.id,
      deletedAt: new Date(),
    });

    await deleteDocument(documentFixture.id, userFixture.id);

    expect(removeCollaboratorsForDocumentMock)
      .toHaveBeenCalledWith(documentFixture.id);
    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    softDeleteDocumentMock.mockResolvedValue(undefined);

    const [error] = await deleteDocument(documentFixture.id, otherUserId);

    expect(error).toBe(DeleteDocumentError.PermissionDenied);
    expect(removeCollaboratorsForDocumentMock).not.toHaveBeenCalled();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });
});

describe('restoreDocument', () => {
  it('restores a deleted document for its owner', async () => {
    restoreDocumentRowMock.mockResolvedValue({
      id: documentFixture.id,
      deletedAt: null,
    });

    const [error, result] = await restoreDocument(
      documentFixture.id, userFixture.id,
    );

    expect(error).toBeNull();
    expect(result).toStrictEqual({ id: documentFixture.id });
    expect(restoreDocumentRowMock)
      .toHaveBeenCalledWith(documentFixture.id, userFixture.id);
  });

  it('denies somebody who does not own the document', async () => {
    restoreDocumentRowMock.mockResolvedValue(undefined);

    const [error] = await restoreDocument(documentFixture.id, otherUserId);

    expect(error).toBe(DeleteDocumentError.PermissionDenied);
  });
});
