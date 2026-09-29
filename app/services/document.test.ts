// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import {
  addImage,
  AddImageError,
  changeCollaboratorAccess,
  ChangeCollaboratorAccessError,
  changeLinkAccess,
  ChangeLinkAccessError,
  copyImage,
  CopyImageError,
  createDocument,
  CreateDocumentError,
  deleteDocument,
  DeleteDocumentError,
  getLiveAccess,
  inviteCollaborator,
  InviteCollaboratorError,
  listInvitedCollaborators,
  openAsset,
  OpenAssetError,
  openDocument,
  OpenDocumentError,
  purgeDeletedDocuments,
  removeCollaborator,
  RemoveCollaboratorError,
  restoreDocument,
  shareDocument,
  ShareDocumentError,
  signAssetUrl,
} from './document';
import {
  DOCUMENT_INVITE_LIMIT,
  type DocumentCollaboratorSource,
  type DocumentLinkAccess,
} from '~/constants/document';
import type { Config } from '~/config';
import { EmailTemplate } from '~/constants/email';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { createHeadlessEditorState } from '~/utils/headless';
import { $createTextNode, $getRoot } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { EDITOR_NODES } from '~/ui/editor/editor-nodes';
import { $createImageNode } from '~/ui/editor/nodes/image-node';

type CdnConfig = Config['storage']['cdn'];
const cdn = vi.hoisted(() => ({ config: undefined as CdnConfig }));
vi.mock('~/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/config')>();
  return {
    ...actual,
    getConfig: () => {
      const config = actual.getConfig();
      return { ...config, storage: { ...config.storage, cdn: cdn.config } };
    },
  };
});

const getDocumentForViewerMock = vi.fn();
const getDocumentMock = vi.fn();
const connectCollaboratorMock = vi.fn();
const acceptInviteMock = vi.fn();
const setDocumentLinkSharedMock = vi.fn();
const setDocumentLinkAccessMock = vi.fn();
const removeLinkCollaboratorsMock = vi.fn();
const softDeleteDocumentMock = vi.fn();
const restoreDocumentRowMock = vi.fn();
const countOwnedDocumentsMock = vi.fn();
const createDocumentRowMock = vi.fn();
const getDocumentIdsDeletedBeforeMock = vi.fn();
const hardDeleteDocumentsMock = vi.fn();
const getInvitedCollaboratorsMock = vi.fn();
const insertInviteMock = vi.fn();
const setCollaboratorAccessMock = vi.fn();
const deleteCollaboratorMock = vi.fn();
const createDocumentAssetMock = vi.fn();
const getDocumentAssetMock = vi.fn();
const getDocumentAssetsMock = vi.fn();
const deleteDocumentAssetsMock = vi.fn();
vi.mock('~/repos/document', () => ({
  countOwnedDocuments: (...args: unknown[]) => countOwnedDocumentsMock(...args),
  createDocument: (...args: unknown[]) => createDocumentRowMock(...args),
  getDocumentForViewer: (...args: unknown[]) =>
    getDocumentForViewerMock(...args),
  getDocument: (...args: unknown[]) => getDocumentMock(...args),
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
  getDocumentIdsDeletedBefore: (...args: unknown[]) =>
    getDocumentIdsDeletedBeforeMock(...args),
  hardDeleteDocuments: (...args: unknown[]) =>
    hardDeleteDocumentsMock(...args),
  getInvitedCollaborators: (...args: unknown[]) =>
    getInvitedCollaboratorsMock(...args),
  inviteCollaborator: (...args: unknown[]) => insertInviteMock(...args),
  setCollaboratorAccess: (...args: unknown[]) =>
    setCollaboratorAccessMock(...args),
  removeCollaborator: (...args: unknown[]) => deleteCollaboratorMock(...args),
  createDocumentAsset: (...args: unknown[]) =>
    createDocumentAssetMock(...args),
  getDocumentAsset: (...args: unknown[]) => getDocumentAssetMock(...args),
  getDocumentAssets: (...args: unknown[]) => getDocumentAssetsMock(...args),
  deleteDocumentAssets: (...args: unknown[]) =>
    deleteDocumentAssetsMock(...args),
}));

const deleteObjectsMock = vi.fn();
const putObjectMock = vi.fn();
const copyObjectMock = vi.fn();
const getObjectStreamMock = vi.fn();
vi.mock('~/clients/storage', () => ({
  deleteObjects: (...args: unknown[]) => deleteObjectsMock(...args),
  copyObject: (...args: unknown[]) => copyObjectMock(...args),
  putObject: (...args: unknown[]) => putObjectMock(...args),
  getObjectStream: (...args: unknown[]) => getObjectStreamMock(...args),
}));

const getUserByEmailMock = vi.fn();
vi.mock('~/repos/user', () => ({
  getUserByEmail: (...args: unknown[]) => getUserByEmailMock(...args),
}));

const countEmailLogsByUserMock = vi.fn();
vi.mock('~/repos/email-log', () => ({
  countEmailLogsByUser: (...args: unknown[]) =>
    countEmailLogsByUserMock(...args),
}));

const sendEmailDocumentInviteMock = vi.fn();
vi.mock('./email-templates', () => ({
  sendEmailDocumentInvite: (...args: unknown[]) =>
    sendEmailDocumentInviteMock(...args),
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

/** A document somebody else owns, open to anyone through the link. */
function linkDocument(linkAccess: DocumentLinkAccess) {
  return viewerDocument({ userId: otherUserId, linkShared: true, linkAccess });
}

const documentId = documentFixture.id;

async function createPng(width: number, height: number) {
  const data = await sharp({
    create: { width, height, channels: 3, background: '#39f' },
  }).png().toBuffer();

  return new File([new Uint8Array(data)], 'image.png', { type: 'image/png' });
}

beforeEach(() => {
  vi.clearAllMocks();
  cdn.config = undefined;
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
      preview: null,
    });
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('comes with a preview of what was last stored', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());
    getDocumentMock.mockResolvedValue({
      ...documentFixture,
      content: createHeadlessEditorState(() => {
        const heading = $createHeadingNode('h1');
        heading.append($createTextNode('Groceries'));
        $getRoot().clear().append(heading);
      }),
    });

    const [, document] = await openDocument(documentFixture.id, viewer);

    expect(getDocumentMock).toHaveBeenCalledWith(documentFixture.id);
    expect(document?.preview).toContain('Groceries</span></h1>');
  });

  it('points the preview\'s images at the CDN', async () => {
    cdn.config = { url: 'https://cdn.example', tokenKey: 'key' };
    const assetId = 'b3f1c2d4-0000-4000-8000-000000000000';
    const src = `/doc/${documentFixture.id}/assets/${assetId}`;
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());
    getDocumentAssetsMock.mockResolvedValue([
      { id: assetId, documentId: documentFixture.id, storageKey: 'a.webp' },
    ]);
    getDocumentMock.mockResolvedValue({
      ...documentFixture,
      content: createHeadlessEditorState(() => {
        $getRoot().append($createImageNode({ src, width: 800, height: 600 }));
      }, EDITOR_NODES),
    });

    const [, document] = await openDocument(documentFixture.id, viewer);

    expect(getDocumentAssetsMock).toHaveBeenCalledWith([documentFixture.id]);
    expect(document?.preview).toMatch(
      /<img src="https:\/\/cdn\.example\/a\.webp\?token=HS256-/,
    );
    expect(document?.preview).toContain(`data-src="${src}"`);
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

describe('createDocument', () => {
  beforeEach(() => {
    createDocumentRowMock.mockResolvedValue(documentFixture);
  });

  it('creates a document below the free limit', async () => {
    countOwnedDocumentsMock.mockResolvedValue(FREE_DOCUMENT_LIMIT - 1);

    const result = await createDocument({
      ...userFixture,
      hasSubscription: false,
    });

    expect(result).toEqual([null, { id: documentFixture.id }]);
    expect(createDocumentRowMock).toHaveBeenCalledWith({
      userId: userFixture.id,
    });
  });

  it('refuses a free account at the limit', async () => {
    countOwnedDocumentsMock.mockResolvedValue(FREE_DOCUMENT_LIMIT);

    const result = await createDocument({
      ...userFixture,
      hasSubscription: false,
    });

    expect(result).toEqual([CreateDocumentError.LimitReached]);
    expect(createDocumentRowMock).not.toHaveBeenCalled();
  });

  it('does not limit a subscribed account', async () => {
    countOwnedDocumentsMock.mockResolvedValue(FREE_DOCUMENT_LIMIT + 10);

    const result = await createDocument({
      ...userFixture,
      hasSubscription: true,
    });

    expect(result).toEqual([null, { id: documentFixture.id }]);
  });
});

describe('purgeDeletedDocuments', () => {
  const before = new Date('2026-08-29T04:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the files, then the assets, then the documents', async () => {
    const ids = [documentFixture.id];
    const calls: string[] = [];
    getDocumentIdsDeletedBeforeMock.mockResolvedValueOnce(ids);
    getDocumentAssetsMock.mockResolvedValue([
      { storageKey: 'documents/a/1.webp' },
      { storageKey: 'documents/a/2.webp' },
    ]);
    deleteObjectsMock.mockImplementation(() => calls.push('objects'));
    deleteDocumentAssetsMock.mockImplementation(() => calls.push('assets'));
    hardDeleteDocumentsMock.mockImplementation(() => calls.push('documents'));

    const deletedCount = await purgeDeletedDocuments(before);

    expect(deletedCount).toBe(1);
    expect(getDocumentIdsDeletedBeforeMock).toHaveBeenCalledWith(
      before, 1000,
    );
    expect(deleteObjectsMock).toHaveBeenCalledWith([
      'documents/a/1.webp',
      'documents/a/2.webp',
    ]);
    expect(deleteDocumentAssetsMock).toHaveBeenCalledWith(ids);
    expect(hardDeleteDocumentsMock).toHaveBeenCalledWith(ids);
    expect(calls).toEqual(['objects', 'assets', 'documents']);
  });

  it('keeps going while a batch comes back full', async () => {
    const fullBatch = Array.from({ length: 1000 }, (_, i) => `id-${i}`);
    getDocumentIdsDeletedBeforeMock
      .mockResolvedValueOnce(fullBatch)
      .mockResolvedValueOnce(['last']);
    getDocumentAssetsMock.mockResolvedValue([]);

    const deletedCount = await purgeDeletedDocuments(before);

    expect(deletedCount).toBe(1001);
    expect(hardDeleteDocumentsMock).toHaveBeenCalledTimes(2);
  });

  it('does nothing when no document is due', async () => {
    getDocumentIdsDeletedBeforeMock.mockResolvedValueOnce([]);

    expect(await purgeDeletedDocuments(before)).toBe(0);
    expect(deleteObjectsMock).not.toHaveBeenCalled();
    expect(hardDeleteDocumentsMock).not.toHaveBeenCalled();
  });
});

describe('invites', () => {
  const owner = { ...userFixture, hasSubscription: true };
  const inviteId = 'b2c3d4e5-0000-4000-8000-000000000000';

  function ownedDocument(overrides?: Partial<{
    userId: string;
    deletedAt: Date | null;
  }>) {
    return {
      id: documentFixture.id,
      title: documentFixture.title,
      linkShared: false,
      linkAccess: 'view',
      userId: owner.id,
      deletedAt: null,
      collaborator: null,
      ...overrides,
    };
  }

  function inviteAddress(email: string) {
    return inviteCollaborator({
      documentId: documentFixture.id,
      user: owner,
      email,
      access: 'edit',
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    getDocumentForViewerMock.mockResolvedValue(ownedDocument());
    getUserByEmailMock.mockResolvedValue(undefined);
    countEmailLogsByUserMock.mockResolvedValue(0);
    insertInviteMock.mockResolvedValue({ id: inviteId });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('listInvitedCollaborators', () => {
    it('marks an invite pending until it was accepted', async () => {
      getInvitedCollaboratorsMock.mockResolvedValue([
        {
          id: collaboratorId,
          userId: otherUserId,
          email: 'ada@example.com',
          access: 'edit',
          acceptedAt: new Date(),
          name: 'Ada',
        },
        {
          id: inviteId,
          userId: otherUserId,
          email: 'grace@example.com',
          access: 'view',
          acceptedAt: null,
          name: null,
        },
      ]);

      expect(await listInvitedCollaborators(documentFixture.id)).toStrictEqual([
        {
          id: collaboratorId,
          name: 'Ada',
          email: 'ada@example.com',
          access: 'edit',
          pending: false,
        },
        {
          id: inviteId,
          name: null,
          email: 'grace@example.com',
          access: 'view',
          pending: true,
        },
      ]);
    });
  });

  describe('inviteCollaborator', () => {
    it('records the invite and sends the e-mail keyed by it', async () => {
      const [error, result] = await inviteAddress(' Grace@Example.com ');

      expect(error).toBeNull();
      expect(result).toStrictEqual({ email: 'grace@example.com' });
      expect(insertInviteMock).toHaveBeenCalledWith({
        documentId: documentFixture.id,
        email: 'grace@example.com',
        access: 'edit',
        userId: undefined,
      });
      expect(sendEmailDocumentInviteMock).toHaveBeenCalledWith({
        to: { email: 'grace@example.com' },
        inviteId,
        documentId: documentFixture.id,
        documentTitle: documentFixture.title,
        inviterName: owner.name,
        inviterId: owner.id,
      });
    });

    it('hands the account of the address over when there is one', async () => {
      getUserByEmailMock.mockResolvedValue({ id: otherUserId });

      await inviteAddress('grace@example.com');

      expect(getUserByEmailMock).toHaveBeenCalledWith('grace@example.com');
      expect(insertInviteMock).toHaveBeenCalledWith(
        expect.objectContaining({ userId: otherUserId }),
      );
    });

    it('names the owner by e-mail when they have no name', async () => {
      await inviteCollaborator({
        documentId: documentFixture.id,
        user: { ...owner, name: null },
        email: 'grace@example.com',
        access: 'view',
      });

      expect(sendEmailDocumentInviteMock).toHaveBeenCalledWith(
        expect.objectContaining({ inviterName: owner.email }),
      );
    });

    it('refuses anybody but the owner', async () => {
      getDocumentForViewerMock.mockResolvedValue(
        ownedDocument({ userId: otherUserId }),
      );

      const [error] = await inviteAddress('grace@example.com');

      expect(error).toBe(InviteCollaboratorError.PermissionDenied);
      expect(insertInviteMock).not.toHaveBeenCalled();
    });

    it('refuses a deleted document', async () => {
      getDocumentForViewerMock.mockResolvedValue(
        ownedDocument({ deletedAt: new Date() }),
      );

      const [error] = await inviteAddress('grace@example.com');

      expect(error).toBe(InviteCollaboratorError.PermissionDenied);
    });

    it('refuses an unknown document', async () => {
      getDocumentForViewerMock.mockResolvedValue(undefined);

      const [error] = await inviteAddress('grace@example.com');

      expect(error).toBe(InviteCollaboratorError.PermissionDenied);
    });

    it('needs the paid plan', async () => {
      const [error] = await inviteCollaborator({
        documentId: documentFixture.id,
        user: { ...owner, hasSubscription: false },
        email: 'grace@example.com',
        access: 'edit',
      });

      expect(error).toBe(InviteCollaboratorError.SubscriptionRequired);
      expect(insertInviteMock).not.toHaveBeenCalled();
    });

    it('refuses the owner\'s own address', async () => {
      const [error] = await inviteAddress(owner.email.toUpperCase());

      expect(error).toBe(InviteCollaboratorError.Owner);
      expect(insertInviteMock).not.toHaveBeenCalled();
    });

    it('refuses an address that is invited already', async () => {
      insertInviteMock.mockResolvedValue(undefined);

      const [error] = await inviteAddress('grace@example.com');

      expect(error).toBe(InviteCollaboratorError.AlreadyInvited);
      expect(sendEmailDocumentInviteMock).not.toHaveBeenCalled();
    });

    it('counts the invite e-mails the owner sent in the last day', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-22T12:00:00Z'));
      countEmailLogsByUserMock.mockResolvedValue(DOCUMENT_INVITE_LIMIT - 1);

      const [error] = await inviteAddress('grace@example.com');

      expect(error).toBeNull();
      expect(countEmailLogsByUserMock).toHaveBeenCalledWith({
        userId: owner.id,
        template: EmailTemplate.DocumentInvite,
        since: new Date('2026-09-21T12:00:00Z'),
      });
    });

    it('refuses an invite past the limit', async () => {
      countEmailLogsByUserMock.mockResolvedValue(DOCUMENT_INVITE_LIMIT);

      const [error] = await inviteAddress('grace@example.com');

      expect(error).toBe(InviteCollaboratorError.TooManyInvites);
      expect(insertInviteMock).not.toHaveBeenCalled();
      expect(sendEmailDocumentInviteMock).not.toHaveBeenCalled();
    });
  });

  describe('changeCollaboratorAccess', () => {
    it('changes the access and reconnects the person', async () => {
      setCollaboratorAccessMock.mockResolvedValue({
        id: collaboratorId,
        userId: otherUserId,
        access: 'view',
      });

      const [error, result] = await changeCollaboratorAccess({
        documentId: documentFixture.id,
        userId: owner.id,
        collaboratorId,
        access: 'view',
      });

      expect(error).toBeNull();
      expect(result).toStrictEqual({ access: 'view' });
      expect(setCollaboratorAccessMock).toHaveBeenCalledWith({
        documentId: documentFixture.id,
        ownerId: owner.id,
        collaboratorId,
        access: 'view',
      });
      expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
        documentId: documentFixture.id,
        userId: otherUserId,
      });
    });

    it('has nobody to reconnect for a pending invite', async () => {
      setCollaboratorAccessMock.mockResolvedValue({
        id: collaboratorId,
        userId: null,
        access: 'view',
      });

      const [error] = await changeCollaboratorAccess({
        documentId: documentFixture.id,
        userId: owner.id,
        collaboratorId,
        access: 'view',
      });

      expect(error).toBeNull();
      expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
    });

    it('denies whoever the update refused', async () => {
      setCollaboratorAccessMock.mockResolvedValue(undefined);

      const [error] = await changeCollaboratorAccess({
        documentId: documentFixture.id,
        userId: otherUserId,
        collaboratorId,
        access: 'view',
      });

      expect(error).toBe(ChangeCollaboratorAccessError.PermissionDenied);
      expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
    });
  });

  describe('removeCollaborator', () => {
    it('deletes the row and closes the person\'s connections', async () => {
      deleteCollaboratorMock.mockResolvedValue({
        id: collaboratorId,
        userId: otherUserId,
      });

      const [error, result] = await removeCollaborator({
        documentId: documentFixture.id,
        userId: owner.id,
        collaboratorId,
      });

      expect(error).toBeNull();
      expect(result).toStrictEqual({ id: collaboratorId });
      expect(deleteCollaboratorMock).toHaveBeenCalledWith({
        documentId: documentFixture.id,
        ownerId: owner.id,
        collaboratorId,
      });
      expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
        documentId: documentFixture.id,
        userId: otherUserId,
      });
    });

    it('has nobody to disconnect for a pending invite', async () => {
      deleteCollaboratorMock.mockResolvedValue({
        id: collaboratorId,
        userId: null,
      });

      const [error] = await removeCollaborator({
        documentId: documentFixture.id,
        userId: owner.id,
        collaboratorId,
      });

      expect(error).toBeNull();
      expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
    });

    it('denies whoever the delete refused', async () => {
      deleteCollaboratorMock.mockResolvedValue(undefined);

      const [error] = await removeCollaborator({
        documentId: documentFixture.id,
        userId: otherUserId,
        collaboratorId,
      });

      expect(error).toBe(RemoveCollaboratorError.PermissionDenied);
    });
  });
});

describe('addImage', () => {
  it('stores the processed image and records it', async () => {
    getDocumentForViewerMock.mockResolvedValue(linkDocument('edit'));

    const [error, image] = await addImage({
      documentId,
      viewer,
      file: await createPng(2000, 1000),
    });

    expect(error).toBeNull();
    expect(image).toMatchObject({ width: 1600, height: 800 });
    expect(getDocumentForViewerMock).toHaveBeenCalledWith(documentId, viewer);

    const storageKey = `documents/${documentId}/${image!.id}.webp`;
    expect(putObjectMock).toHaveBeenCalledWith({
      key: storageKey,
      body: expect.any(Uint8Array),
      contentType: 'image/webp',
    });
    expect(createDocumentAssetMock).toHaveBeenCalledWith({
      id: image!.id,
      documentId,
      userId: viewer.id,
      storageKey,
      contentType: 'image/webp',
      byteSize: putObjectMock.mock.calls[0][0].body.byteLength,
      width: 1600,
      height: 800,
    });
  });

  it('stores an image of a signed out editor without an uploader', async () => {
    getDocumentForViewerMock.mockResolvedValue(linkDocument('edit'));

    await addImage({ documentId, file: await createPng(10, 10) });

    expect(createDocumentAssetMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined }),
    );
  });

  it('refuses somebody without access', async () => {
    getDocumentForViewerMock.mockResolvedValue(undefined);

    const result = await addImage({
      documentId,
      viewer,
      file: await createPng(10, 10),
    });

    expect(result).toEqual([AddImageError.NotFound]);
    expect(putObjectMock).not.toHaveBeenCalled();
  });

  it('refuses somebody who may only read', async () => {
    getDocumentForViewerMock.mockResolvedValue(linkDocument('view'));

    const result = await addImage({
      documentId,
      viewer,
      file: await createPng(10, 10),
    });

    expect(result).toEqual([AddImageError.PermissionDenied]);
    expect(putObjectMock).not.toHaveBeenCalled();
  });

  it('refuses a file over 10 MB', async () => {
    getDocumentForViewerMock.mockResolvedValue(linkDocument('edit'));
    const file = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      'huge.png',
      { type: 'image/png' },
    );

    const result = await addImage({ documentId, viewer, file });

    expect(result).toEqual([AddImageError.TooLarge]);
    expect(putObjectMock).not.toHaveBeenCalled();
  });

  it('refuses a file that is not an accepted image', async () => {
    getDocumentForViewerMock.mockResolvedValue(linkDocument('edit'));
    const file = new File(['<svg></svg>'], 'image.png', {
      type: 'image/png',
    });

    const result = await addImage({ documentId, viewer, file });

    expect(result).toEqual([AddImageError.UnsupportedType]);
    expect(putObjectMock).not.toHaveBeenCalled();
    expect(createDocumentAssetMock).not.toHaveBeenCalled();
  });
});

describe('copyImage', () => {
  const sourceDocumentId = 'c4a2d3e5-0000-4000-8000-000000000000';
  const source = {
    id: 'd5b3e4f6-0000-4000-8000-000000000000',
    documentId: sourceDocumentId,
    storageKey: `documents/${sourceDocumentId}/d5b3e4f6.webp`,
    contentType: 'image/webp',
    byteSize: 1234,
    width: 800,
    height: 600,
  };
  const src = `/doc/${sourceDocumentId}/assets/${source.id}`;

  it('copies the image into the document and records it', async () => {
    getDocumentForViewerMock.mockResolvedValue(linkDocument('edit'));
    getDocumentAssetMock.mockResolvedValue(source);

    const [error, image] = await copyImage({ documentId, viewer, src });

    expect(error).toBeNull();
    expect(image).toMatchObject({ width: 800, height: 600 });
    expect(getDocumentForViewerMock).toHaveBeenCalledWith(documentId, viewer);
    expect(getDocumentForViewerMock)
      .toHaveBeenCalledWith(sourceDocumentId, viewer);

    const storageKey = `documents/${documentId}/${image!.id}.webp`;
    expect(copyObjectMock).toHaveBeenCalledWith(source.storageKey, storageKey);
    expect(createDocumentAssetMock).toHaveBeenCalledWith({
      id: image!.id,
      documentId,
      userId: viewer.id,
      storageKey,
      contentType: 'image/webp',
      byteSize: 1234,
      width: 800,
      height: 600,
    });
  });

  it('does not copy into a document the viewer may only read', async () => {
    getDocumentForViewerMock.mockResolvedValue(linkDocument('view'));

    const result = await copyImage({ documentId, viewer, src });

    expect(result).toEqual([CopyImageError.PermissionDenied]);
    expect(copyObjectMock).not.toHaveBeenCalled();
  });

  it('does not copy from a document the viewer may not open', async () => {
    getDocumentForViewerMock
      .mockResolvedValueOnce(linkDocument('edit'))
      .mockResolvedValueOnce(undefined);
    getDocumentAssetMock.mockResolvedValue(source);

    const result = await copyImage({ documentId, viewer, src });

    expect(result).toEqual([CopyImageError.NotFound]);
    expect(copyObjectMock).not.toHaveBeenCalled();
  });

  it('does not copy an asset under another document', async () => {
    getDocumentForViewerMock.mockResolvedValue(linkDocument('edit'));
    getDocumentAssetMock.mockResolvedValue({ ...source, documentId });

    const result = await copyImage({ documentId, viewer, src });

    expect(result).toEqual([CopyImageError.NotFound]);
    expect(copyObjectMock).not.toHaveBeenCalled();
  });

  it('does not copy what is not one of our assets', async () => {
    getDocumentForViewerMock.mockResolvedValue(linkDocument('edit'));

    const result = await copyImage({
      documentId,
      viewer,
      src: 'https://example.com/image.png',
    });

    expect(result).toEqual([CopyImageError.NotFound]);
    expect(getDocumentAssetMock).not.toHaveBeenCalled();
  });

  it('does not exist for somebody who may not open the document', async () => {
    getDocumentForViewerMock.mockResolvedValue(undefined);

    expect(await copyImage({ documentId, src }))
      .toEqual([CopyImageError.NotFound]);
  });
});

describe('openAsset', () => {
  const asset = {
    id: 'b3f1c2d4-0000-4000-8000-000000000000',
    documentId,
    storageKey: `documents/${documentId}/b3f1c2d4.webp`,
    contentType: 'image/webp',
    byteSize: 1234,
  };
  const body = new ReadableStream();

  it('streams the asset to somebody who may open its document', async () => {
    getDocumentAssetMock.mockResolvedValue(asset);
    getDocumentForViewerMock.mockResolvedValue(linkDocument('view'));
    getObjectStreamMock.mockResolvedValue(body);

    const result = await openAsset(documentId, asset.id, viewer);

    expect(result).toEqual([null, {
      contentType: 'image/webp',
      byteSize: 1234,
      body,
    }]);
    expect(getDocumentForViewerMock).toHaveBeenCalledWith(documentId, viewer);
    expect(getObjectStreamMock).toHaveBeenCalledWith(asset.storageKey);
  });

  it('signs a CDN URL instead of streaming when there is a CDN', async () => {
    cdn.config = { url: 'https://cdn.example', tokenKey: 'key' };
    getDocumentAssetMock.mockResolvedValue(asset);
    getDocumentForViewerMock.mockResolvedValue(linkDocument('view'));

    const [error, opened] = await openAsset(documentId, asset.id, viewer);

    expect(error).toBeNull();
    expect(opened).toMatchObject({
      url: expect.stringMatching(
        `^https://cdn.example/${asset.storageKey}\\?token=HS256-`,
      ),
    });
    expect(getObjectStreamMock).not.toHaveBeenCalled();
  });

  it('does not exist for somebody who may not open the document', async () => {
    getDocumentAssetMock.mockResolvedValue(asset);
    getDocumentForViewerMock.mockResolvedValue(undefined);

    const result = await openAsset(documentId, asset.id, viewer);

    expect(result).toEqual([OpenAssetError.NotFound]);
    expect(getObjectStreamMock).not.toHaveBeenCalled();
  });

  it('does not exist under another document', async () => {
    getDocumentAssetMock.mockResolvedValue(asset);
    getDocumentForViewerMock.mockResolvedValue(linkDocument('edit'));

    const result = await openAsset(
      'c4a2d3e5-0000-4000-8000-000000000000',
      asset.id,
      viewer,
    );

    expect(result).toEqual([OpenAssetError.NotFound]);
    expect(getDocumentForViewerMock).not.toHaveBeenCalled();
    expect(getObjectStreamMock).not.toHaveBeenCalled();
  });

  it('does not exist when there is no such asset', async () => {
    getDocumentAssetMock.mockResolvedValue(undefined);

    expect(await openAsset(documentId, asset.id))
      .toEqual([OpenAssetError.NotFound]);
  });

  it('does not exist when the bucket has lost the file', async () => {
    getDocumentAssetMock.mockResolvedValue(asset);
    getDocumentForViewerMock.mockResolvedValue(linkDocument('edit'));
    getObjectStreamMock.mockResolvedValue(undefined);

    expect(await openAsset(documentId, asset.id))
      .toEqual([OpenAssetError.NotFound]);
  });
});

describe('signAssetUrl', () => {
  const cdnConfig = { url: 'https://cdn.example', tokenKey: 'key' };
  const key = 'documents/a/b.webp';

  it('hands out the same URL for the whole window', () => {
    const start = signAssetUrl(key, cdnConfig, 1_800_000_000_000);
    const end = signAssetUrl(key, cdnConfig, 1_800_000_299_000);

    expect(end.url).toBe(start.url);
    expect(start.url).toMatch(/&expires=1800000600$/);
  });

  it('may be kept until the window ends', () => {
    expect(signAssetUrl(key, cdnConfig, 1_800_000_000_000).maxAge).toBe(300);
    expect(signAssetUrl(key, cdnConfig, 1_800_000_299_000).maxAge).toBe(1);
  });

  it('hands out a new URL in the next window', () => {
    const next = signAssetUrl(key, cdnConfig, 1_800_000_300_000);

    expect(next.url).toMatch(/&expires=1800000900$/);
  });
});
