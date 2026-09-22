// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  changeLinkAccess,
  ChangeLinkAccessError,
  deleteDocument,
  DeleteDocumentError,
  getLiveAccess,
  openDocument,
  OpenDocumentError,
  restoreDocument,
  shareDocument,
  ShareDocumentError,
} from './document';
import type {
  DocumentCollaboratorSource,
  DocumentLinkAccess,
} from '~/constants/document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';

const getDocumentForViewerMock = vi.fn();
const connectCollaboratorMock = vi.fn();
const acceptInviteMock = vi.fn();
const setDocumentLinkSharedMock = vi.fn();
const setDocumentLinkAccessMock = vi.fn();
const removeLinkCollaboratorsMock = vi.fn();
const softDeleteDocumentMock = vi.fn();
const restoreDocumentRowMock = vi.fn();
vi.mock('~/repos/document', () => ({
  getDocumentForViewer: (...args: unknown[]) =>
    getDocumentForViewerMock(...args),
  connectCollaborator: (...args: unknown[]) => connectCollaboratorMock(...args),
  acceptInvite: (...args: unknown[]) => acceptInviteMock(...args),
  setDocumentLinkShared: (...args: unknown[]) =>
    setDocumentLinkSharedMock(...args),
  setDocumentLinkAccess: (...args: unknown[]) =>
    setDocumentLinkAccessMock(...args),
  removeLinkCollaborators: (...args: unknown[]) =>
    removeLinkCollaboratorsMock(...args),
  softDeleteDocument: (...args: unknown[]) => softDeleteDocumentMock(...args),
  restoreDocument: (...args: unknown[]) => restoreDocumentRowMock(...args),
}));

const closeDocumentConnectionsMock = vi.fn();
vi.mock('~/live/connections', () => ({
  closeDocumentConnections: (...args: unknown[]) =>
    closeDocumentConnectionsMock(...args),
}));

const otherUserId = 'e6d9c8f1-0000-4000-8000-000000000000';
const collaboratorId = 'a1b2c3d4-0000-4000-8000-000000000000';
const viewer = { id: userFixture.id, email: userFixture.email };

type Collaborator = {
  id: string;
  source: DocumentCollaboratorSource;
  userId: string | null;
  email: string | null;
  access: DocumentLinkAccess | null;
  acceptedAt: Date | null;
};

function viewerDocument(overrides?: Partial<{
  linkShared: boolean;
  linkAccess: DocumentLinkAccess;
  userId: string;
  deletedAt: Date | null;
  collaborator: Collaborator | null;
}>) {
  return {
    id: documentFixture.id,
    title: documentFixture.title,
    linkShared: false,
    linkAccess: 'view' as DocumentLinkAccess,
    userId: userFixture.id,
    deletedAt: null,
    collaborator: null,
    ...overrides,
  };
}

/** The viewer's row for a connection made through the link. */
function linkCollaborator(): Collaborator {
  return {
    id: collaboratorId,
    source: 'link',
    userId: viewer.id,
    email: null,
    access: null,
    acceptedAt: null,
  };
}

/**
 * The viewer's invite, pending until `accepted`; `linked` when the
 * address had an account at the time of the invite.
 */
function invite(
  access: DocumentLinkAccess,
  { accepted = false, linked = false }: {
    accepted?: boolean;
    linked?: boolean;
  } = {},
): Collaborator {
  return {
    id: collaboratorId,
    source: 'invite',
    userId: linked || accepted ? viewer.id : null,
    email: viewer.email,
    access,
    acceptedAt: accepted ? new Date() : null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('openDocument', () => {
  it('returns not found for an unknown document', async () => {
    getDocumentForViewerMock.mockResolvedValue(undefined);

    const [error] = await openDocument(documentFixture.id, viewer);

    expect(error).toBe(OpenDocumentError.NotFound);
  });

  it('opens a deleted document for its owner, marked as deleted', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ deletedAt: new Date() }),
    );

    const [error, document] = await openDocument(
      documentFixture.id, viewer,
    );

    expect(error).toBeNull();
    expect(document).toMatchObject({ isOwner: true, deleted: true });
  });

  it('returns not found for a deleted document to anybody else', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      linkShared: true,
      collaborator: linkCollaborator(),
      deletedAt: new Date(),
    }));

    expect((await openDocument(documentFixture.id, viewer))[0])
      .toBe(OpenDocumentError.NotFound);
    expect((await openDocument(documentFixture.id))[0])
      .toBe(OpenDocumentError.NotFound);
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('reads the document and the collaborator status in one query', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    await openDocument(documentFixture.id, viewer);

    expect(getDocumentForViewerMock).toHaveBeenCalledTimes(1);
    expect(getDocumentForViewerMock)
      .toHaveBeenCalledWith(documentFixture.id, viewer);
  });

  it('lets the owner open a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    const [error, document] = await openDocument(
      documentFixture.id, viewer,
    );

    expect(error).toBeNull();
    expect(document).toStrictEqual({
      title: documentFixture.title,
      linkShared: false,
      linkAccess: 'view',
      isOwner: true,
      deleted: false,
      readOnly: false,
      hasJoined: false,
    });
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('opens read-only for a visitor a link only lets read', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, linkShared: true }),
    );

    const [, document] = await openDocument(documentFixture.id);

    expect(document?.readOnly).toBe(true);
  });

  it('opens editable for a visitor a link lets edit', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({
        userId: otherUserId,
        linkShared: true,
        linkAccess: 'edit',
      }),
    );

    const [, document] = await openDocument(documentFixture.id);

    expect(document?.readOnly).toBe(false);
  });

  it('denies a visitor access to a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId }),
    );

    const [error] = await openDocument(documentFixture.id, viewer);

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
      viewerDocument({ userId: otherUserId, linkShared: true }),
    );

    const [error, document] = await openDocument(
      documentFixture.id, viewer,
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
      linkShared: true,
      collaborator: linkCollaborator(),
    }));

    const [, document] = await openDocument(
      documentFixture.id, viewer,
    );

    expect(document?.hasJoined).toBe(false);
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('does not connect an anonymous visitor', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, linkShared: true }),
    );

    const [error, document] = await openDocument(documentFixture.id);

    expect(error).toBeNull();
    expect(document?.hasJoined).toBe(false);
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('accepts a pending invite on the first open of a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      collaborator: invite('edit'),
    }));

    const [error, document] = await openDocument(documentFixture.id, viewer);

    expect(error).toBeNull();
    expect(document).toMatchObject({
      isOwner: false,
      readOnly: false,
      hasJoined: true,
    });
    expect(acceptInviteMock).toHaveBeenCalledWith({
      collaboratorId,
      userId: viewer.id,
    });
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('accepts an invite already tied to the account', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      collaborator: invite('edit', { linked: true }),
    }));

    const [, document] = await openDocument(documentFixture.id, viewer);

    expect(document?.hasJoined).toBe(true);
    expect(acceptInviteMock).toHaveBeenCalledWith({
      collaboratorId,
      userId: viewer.id,
    });
  });

  it('opens an accepted invite without joining again', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      collaborator: invite('edit', { accepted: true }),
    }));

    const [, document] = await openDocument(documentFixture.id, viewer);

    expect(document?.hasJoined).toBe(false);
    expect(acceptInviteMock).not.toHaveBeenCalled();
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('gives an invited person the access the owner set, not the link\'s', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      linkShared: true,
      linkAccess: 'edit',
      collaborator: invite('view', { accepted: true }),
    }));

    const [, document] = await openDocument(documentFixture.id, viewer);

    expect(document?.readOnly).toBe(true);
  });
});

describe('shareDocument', () => {
  it('shares a document for its owner', async () => {
    setDocumentLinkSharedMock.mockResolvedValue({
      id: documentFixture.id,
      linkShared: true,
      linkAccess: 'view',
    });

    const [error, result] = await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      linkShared: true,
    });

    expect(error).toBeNull();
    expect(result?.linkShared).toBe(true);
    expect(setDocumentLinkSharedMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      ownerId: userFixture.id,
      linkShared: true,
    });
    expect(removeLinkCollaboratorsMock).not.toHaveBeenCalled();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });

  it('drops the collaborators when a document is unshared', async () => {
    setDocumentLinkSharedMock.mockResolvedValue({
      id: documentFixture.id,
      linkShared: false,
      linkAccess: 'view',
    });

    const [error, result] = await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      linkShared: false,
    });

    expect(error).toBeNull();
    expect(result?.linkShared).toBe(false);
    expect(removeLinkCollaboratorsMock)
      .toHaveBeenCalledWith(documentFixture.id);
  });

  it('disconnects the collaborators editing right now', async () => {
    setDocumentLinkSharedMock.mockResolvedValue({
      id: documentFixture.id,
      linkShared: false,
      linkAccess: 'view',
    });

    await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      linkShared: false,
    });

    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      keepUserId: userFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    setDocumentLinkSharedMock.mockResolvedValue(undefined);

    const [error] = await shareDocument({
      documentId: documentFixture.id,
      userId: otherUserId,
      linkShared: true,
    });

    expect(error).toBe(ShareDocumentError.PermissionDenied);
    expect(removeLinkCollaboratorsMock).not.toHaveBeenCalled();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });

  it('reports the access the link starts with', async () => {
    setDocumentLinkSharedMock.mockResolvedValue({
      id: documentFixture.id,
      linkShared: true,
      linkAccess: 'view',
    });

    const [, result] = await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      linkShared: true,
    });

    expect(result?.linkAccess).toBe('view');
  });
});

describe('changeLinkAccess', () => {
  it('changes the access for the owner', async () => {
    setDocumentLinkAccessMock.mockResolvedValue({
      id: documentFixture.id,
      linkAccess: 'edit',
    });

    const [error, result] = await changeLinkAccess({
      documentId: documentFixture.id,
      userId: userFixture.id,
      linkAccess: 'edit',
    });

    expect(error).toBeNull();
    expect(result?.linkAccess).toBe('edit');
    expect(setDocumentLinkAccessMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      ownerId: userFixture.id,
      linkAccess: 'edit',
    });
  });

  it('sends everybody else back for the access they have now', async () => {
    setDocumentLinkAccessMock.mockResolvedValue({
      id: documentFixture.id,
      linkAccess: 'view',
    });

    await changeLinkAccess({
      documentId: documentFixture.id,
      userId: userFixture.id,
      linkAccess: 'view',
    });

    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      keepUserId: userFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    setDocumentLinkAccessMock.mockResolvedValue(undefined);

    const [error] = await changeLinkAccess({
      documentId: documentFixture.id,
      userId: otherUserId,
      linkAccess: 'edit',
    });

    expect(error).toBe(ChangeLinkAccessError.PermissionDenied);
  });
});

describe('getLiveAccess', () => {
  it('rejects an unknown document', async () => {
    getDocumentForViewerMock.mockResolvedValue(undefined);

    expect(await getLiveAccess(documentFixture.id, viewer))
      .toBeUndefined();
  });

  it('lets the owner into a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    expect(await getLiveAccess(documentFixture.id, viewer))
      .toStrictEqual({ readOnly: false });
  });

  it('lets the owner into a deleted document read-only', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ deletedAt: new Date() }),
    );

    expect(await getLiveAccess(documentFixture.id, viewer))
      .toStrictEqual({ readOnly: true });
  });

  it('rejects anybody else from a deleted document', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      linkShared: true,
      deletedAt: new Date(),
    }));

    expect(await getLiveAccess(documentFixture.id, viewer))
      .toBeUndefined();
  });

  it('rejects a visitor of a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId }),
    );

    expect(await getLiveAccess(documentFixture.id, viewer))
      .toBeUndefined();
  });

  it('lets an anonymous visitor read a shared document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, linkShared: true }),
    );

    expect(await getLiveAccess(documentFixture.id))
      .toStrictEqual({ readOnly: true });
  });

  it('lets a visitor edit when the link allows it', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({
        userId: otherUserId,
        linkShared: true,
        linkAccess: 'edit',
      }),
    );

    expect(await getLiveAccess(documentFixture.id))
      .toStrictEqual({ readOnly: false });
  });

  it('leaves the owner editing whatever the link allows', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    expect(await getLiveAccess(documentFixture.id, viewer))
      .toStrictEqual({ readOnly: false });
  });

  it('does not connect a collaborator', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, linkShared: true }),
    );

    await getLiveAccess(documentFixture.id, viewer);

    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('lets an invited person into a private document with their access', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      collaborator: invite('view', { accepted: true }),
    }));

    expect(await getLiveAccess(documentFixture.id, viewer))
      .toStrictEqual({ readOnly: true });
  });

  it('lets a pending invite in without accepting it', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      collaborator: invite('edit'),
    }));

    expect(await getLiveAccess(documentFixture.id, viewer))
      .toStrictEqual({ readOnly: false });
    expect(acceptInviteMock).not.toHaveBeenCalled();
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

    expect(removeLinkCollaboratorsMock)
      .toHaveBeenCalledWith(documentFixture.id);
    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    softDeleteDocumentMock.mockResolvedValue(undefined);

    const [error] = await deleteDocument(documentFixture.id, otherUserId);

    expect(error).toBe(DeleteDocumentError.PermissionDenied);
    expect(removeLinkCollaboratorsMock).not.toHaveBeenCalled();
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

  it('closes the read-only connections so the editor reconnects', async () => {
    restoreDocumentRowMock.mockResolvedValue({
      id: documentFixture.id,
      deletedAt: null,
    });

    await restoreDocument(documentFixture.id, userFixture.id);

    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    restoreDocumentRowMock.mockResolvedValue(undefined);

    const [error] = await restoreDocument(documentFixture.id, otherUserId);

    expect(error).toBe(DeleteDocumentError.PermissionDenied);
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });
});
