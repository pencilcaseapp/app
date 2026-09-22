import { describe, expect, it } from 'vitest';
import {
  acceptInvite,
  connectCollaborator,
  countOwnedDocuments,
  createDocument,
  getDeletedDocumentList,
  getDocument,
  getDocumentForViewer,
  getDocumentList,
  getDocumentTitle,
  getInvitedCollaborators,
  inviteCollaborator,
  purgeDocumentsDeletedBefore,
  removeCollaborator,
  removeLinkCollaborators,
  restoreDocument,
  setCollaboratorAccess,
  setDocumentLinkAccess,
  setDocumentLinkShared,
  softDeleteDocument,
  updateDocument,
} from './document';
import { db } from '~/db';
import {
  connectDocumentCollaborator,
  createDeletedDocument,
  createDocumentWithTitle,
  createEmptyDocument,
  createSharedDocument,
  inviteDocumentCollaborator,
} from '~/test/data-factories/document';
import { createTestUser } from '~/test/data-factories/user';

function viewerOf(user: { id: string; email: string }) {
  return { id: user.id, email: user.email };
}

describe('createDocument', () => {
  it('creates an empty document', async () => {
    const user = await createTestUser();
    const document = await createDocument({
      userId: user.id,
    });
    const dbDocument = await db.query.documents.findFirst({
      where: {
        id: document.id,
      },
    });

    expect(dbDocument).toStrictEqual({
      id: document.id,
      title: null,
      content: null,
      linkShared: false,
      linkAccess: 'view',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: null,
      userId: user.id,
    });
  });
});

describe('getDocument', () => {
  it('returns a document by id', async () => {
    const user = await createTestUser();
    const fixture = await createEmptyDocument(user.id);
    const document = await getDocument(fixture.id);

    expect(document).toStrictEqual(fixture);
  });
});

describe('getDocumentTitle', () => {
  it('returns a document title by id', async () => {
    const user = await createTestUser();
    const fixture = await createDocumentWithTitle(user.id);
    const documentTitle = await getDocumentTitle(fixture.id);

    expect(documentTitle).toBe(fixture.title);
  });
});

describe('updateDocument', () => {
  it('updates a document', async () => {
    const user = await createTestUser();
    const fixture = await createEmptyDocument(user.id);

    const updatedDocument = await updateDocument(fixture.id, {
      title: 'Test Document',
      content: Buffer.from('Hello, World!'),
    });

    expect(updatedDocument).toStrictEqual({
      id: fixture.id,
      title: 'Test Document',
      content: Buffer.from('Hello, World!'),
      linkShared: false,
      linkAccess: 'view',
      createdAt: fixture.createdAt,
      updatedAt: expect.any(Date),
      deletedAt: null,
      userId: user.id,
    });
  });
});

describe('setDocumentLinkShared', () => {
  it('turns the link on and off for the owner', async () => {
    const user = await createTestUser();
    const fixture = await createEmptyDocument(user.id);

    const shared = await setDocumentLinkShared({
      documentId: fixture.id,
      ownerId: user.id,
      linkShared: true,
    });
    expect(shared?.linkShared).toBe(true);

    const unshared = await setDocumentLinkShared({
      documentId: fixture.id,
      ownerId: user.id,
      linkShared: false,
    });
    expect(unshared?.linkShared).toBe(false);
  });

  it('does not count as an edit', async () => {
    const user = await createTestUser();
    const fixture = await createDocumentWithTitle(user.id);

    await setDocumentLinkShared({
      documentId: fixture.id,
      ownerId: user.id,
      linkShared: true,
    });

    const document = await getDocument(fixture.id);
    expect(document?.updatedAt).toStrictEqual(fixture.updatedAt);
  });

  it('keeps the document in its place in the navigation', async () => {
    const user = await createTestUser();
    const older = await createDocumentWithTitle(user.id);
    const newer = await createDocumentWithTitle(user.id);

    await setDocumentLinkShared({
      documentId: older.id,
      ownerId: user.id,
      linkShared: true,
    });

    expect((await getDocumentList(user.id)).map(item => item.id))
      .toStrictEqual([newer.id, older.id]);
  });

  it('returns undefined for somebody who is not the owner', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const fixture = await createEmptyDocument(owner.id);

    expect(await setDocumentLinkShared({
      documentId: fixture.id,
      ownerId: other.id,
      linkShared: true,
    })).toBeUndefined();

    const document = await getDocument(fixture.id);
    expect(document?.linkShared).toBe(false);
  });

  it('returns undefined for a deleted document', async () => {
    const user = await createTestUser();
    const fixture = await createDeletedDocument(user.id);

    expect(await setDocumentLinkShared({
      documentId: fixture.id,
      ownerId: user.id,
      linkShared: true,
    })).toBeUndefined();

    const document = await getDocument(fixture.id);
    expect(document?.linkShared).toBe(false);
  });

  it('returns undefined for an invalid id', async () => {
    expect(await setDocumentLinkShared({
      documentId: 'not-a-uuid',
      ownerId: 'not-a-uuid',
      linkShared: true,
    })).toBeUndefined();
  });

  it('puts the link access back to viewing on the next share', async () => {
    const user = await createTestUser();
    const fixture = await createSharedDocument(user.id);
    await setDocumentLinkAccess({
      documentId: fixture.id,
      ownerId: user.id,
      linkAccess: 'edit',
    });

    await setDocumentLinkShared({
      documentId: fixture.id,
      ownerId: user.id,
      linkShared: false,
    });
    const shared = await setDocumentLinkShared({
      documentId: fixture.id,
      ownerId: user.id,
      linkShared: true,
    });

    expect(shared?.linkAccess).toBe('view');
  });
});

describe('setDocumentLinkAccess', () => {
  it('changes what the link allows for the owner', async () => {
    const user = await createTestUser();
    const fixture = await createSharedDocument(user.id);

    const document = await setDocumentLinkAccess({
      documentId: fixture.id,
      ownerId: user.id,
      linkAccess: 'edit',
    });

    expect(document?.linkAccess).toBe('edit');
    expect((await getDocument(fixture.id))?.linkAccess).toBe('edit');
  });

  it('does not count as an edit', async () => {
    const user = await createTestUser();
    const fixture = await createSharedDocument(user.id);

    await setDocumentLinkAccess({
      documentId: fixture.id,
      ownerId: user.id,
      linkAccess: 'edit',
    });

    const document = await getDocument(fixture.id);
    expect(document?.updatedAt).toStrictEqual(fixture.updatedAt);
  });

  it('returns undefined for a document that is not shared', async () => {
    const user = await createTestUser();
    const fixture = await createEmptyDocument(user.id);

    expect(await setDocumentLinkAccess({
      documentId: fixture.id,
      ownerId: user.id,
      linkAccess: 'edit',
    })).toBeUndefined();

    expect((await getDocument(fixture.id))?.linkAccess).toBe('view');
  });

  it('returns undefined for somebody who is not the owner', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const fixture = await createSharedDocument(owner.id);

    expect(await setDocumentLinkAccess({
      documentId: fixture.id,
      ownerId: other.id,
      linkAccess: 'edit',
    })).toBeUndefined();

    expect((await getDocument(fixture.id))?.linkAccess).toBe('view');
  });

  it('returns undefined for an invalid id', async () => {
    expect(await setDocumentLinkAccess({
      documentId: 'not-a-uuid',
      ownerId: 'not-a-uuid',
      linkAccess: 'edit',
    })).toBeUndefined();
  });
});

describe('getDocumentList', () => {
  it('returns a list of documents', async () => {
    const user = await createTestUser();
    const document1 = await createDocumentWithTitle(user.id);
    const document2 = await createDocumentWithTitle(user.id);

    const documents = await getDocumentList(user.id);

    expect(documents).toStrictEqual([
      {
        id: document2.id,
        title: document2.title,
        linkShared: false,
        userId: user.id,
      },
      {
        id: document1.id,
        title: document1.title,
        linkShared: false,
        userId: user.id,
      },
    ]);
  });

  it('includes documents shared with the user as a collaborator', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const ownDocument = await createDocumentWithTitle(collaborator.id);
    const sharedDocument = await createSharedDocument(owner.id);
    await connectDocumentCollaborator(sharedDocument.id, collaborator.id);

    const documents = await getDocumentList(collaborator.id);

    expect(documents).toContainEqual({
      id: ownDocument.id,
      title: ownDocument.title,
      linkShared: false,
      userId: collaborator.id,
    });
    expect(documents).toContainEqual({
      id: sharedDocument.id,
      title: sharedDocument.title,
      linkShared: true,
      userId: owner.id,
    });
  });

  it('does not duplicate a document that is both owned and connected', async () => {
    const user = await createTestUser();
    const document = await createSharedDocument(user.id);
    await connectDocumentCollaborator(document.id, user.id);

    const documents = await getDocumentList(user.id);

    expect(documents.filter(item => item.id === document.id)).toHaveLength(1);
  });

  it('leaves deleted documents out', async () => {
    const user = await createTestUser();
    const document = await createDocumentWithTitle(user.id);
    const deleted = await createDeletedDocument(user.id);

    const documents = await getDocumentList(user.id);

    expect(documents).toStrictEqual([
      {
        id: document.id,
        title: document.title,
        linkShared: false,
        userId: user.id,
      },
    ]);
    expect(documents).not.toContainEqual(
      expect.objectContaining({ id: deleted.id }),
    );
  });
});

describe('getDeletedDocumentList', () => {
  it('returns only the deleted documents the user owns', async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    await createDocumentWithTitle(user.id);
    const deleted = await createDeletedDocument(user.id);
    await createDeletedDocument(other.id);

    const documents = await getDeletedDocumentList(user.id);

    expect(documents).toStrictEqual([
      { id: deleted.id, title: deleted.title },
    ]);
  });

  it('returns an empty list for an invalid id', async () => {
    expect(await getDeletedDocumentList('not-a-uuid')).toStrictEqual([]);
  });
});

describe('countOwnedDocuments', () => {
  it('counts the documents the user created', async () => {
    const user = await createTestUser();
    await createDocumentWithTitle(user.id);
    await createDocumentWithTitle(user.id);

    expect(await countOwnedDocuments(user.id)).toBe(2);
  });

  it('leaves out documents shared with the user', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    await createDocumentWithTitle(collaborator.id);
    const shared = await createSharedDocument(owner.id);
    await connectDocumentCollaborator(shared.id, collaborator.id);

    expect(await countOwnedDocuments(collaborator.id)).toBe(1);
  });

  it('leaves out deleted documents', async () => {
    const user = await createTestUser();
    await createDocumentWithTitle(user.id);
    await createDeletedDocument(user.id);

    expect(await countOwnedDocuments(user.id)).toBe(1);
  });

  it('counts a document the user owns and shared once', async () => {
    const user = await createTestUser();
    const document = await createSharedDocument(user.id);
    await connectDocumentCollaborator(document.id, user.id);

    expect(await countOwnedDocuments(user.id)).toBe(1);
  });

  it('returns zero for an invalid id', async () => {
    expect(await countOwnedDocuments('not-a-uuid')).toBe(0);
  });
});

describe('softDeleteDocument', () => {
  it('marks the document deleted and turns sharing off', async () => {
    const user = await createTestUser();
    const fixture = await createSharedDocument(user.id);

    const deleted = await softDeleteDocument(fixture.id, user.id);

    expect(deleted).toStrictEqual({
      id: fixture.id,
      deletedAt: expect.any(Date),
    });

    const document = await getDocument(fixture.id);
    expect(document?.deletedAt).toBeInstanceOf(Date);
    expect(document?.linkShared).toBe(false);
  });

  it('does not count as an edit', async () => {
    const user = await createTestUser();
    const fixture = await createDocumentWithTitle(user.id);

    await softDeleteDocument(fixture.id, user.id);

    const document = await getDocument(fixture.id);
    expect(document?.updatedAt).toStrictEqual(fixture.updatedAt);
  });

  it('returns undefined for somebody who is not the owner', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const fixture = await createSharedDocument(owner.id);

    expect(await softDeleteDocument(fixture.id, other.id)).toBeUndefined();

    const document = await getDocument(fixture.id);
    expect(document?.deletedAt).toBeNull();
    expect(document?.linkShared).toBe(true);
  });

  it('returns undefined for an invalid id', async () => {
    expect(await softDeleteDocument('not-a-uuid', 'not-a-uuid')).toBeUndefined();
  });
});

describe('restoreDocument', () => {
  it('clears the deletion and keeps sharing off', async () => {
    const user = await createTestUser();
    const fixture = await createDeletedDocument(user.id);

    const restored = await restoreDocument(fixture.id, user.id);

    expect(restored).toStrictEqual({ id: fixture.id, deletedAt: null });

    const document = await getDocument(fixture.id);
    expect(document?.deletedAt).toBeNull();
    expect(document?.linkShared).toBe(false);
  });

  it('keeps the document in its place in the navigation', async () => {
    const user = await createTestUser();
    const older = await createDocumentWithTitle(user.id);
    const newer = await createDocumentWithTitle(user.id);

    await softDeleteDocument(older.id, user.id);
    await restoreDocument(older.id, user.id);

    const document = await getDocument(older.id);
    expect(document?.updatedAt).toStrictEqual(older.updatedAt);
    expect((await getDocumentList(user.id)).map(item => item.id))
      .toStrictEqual([newer.id, older.id]);
  });

  it('returns undefined for somebody who is not the owner', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const fixture = await createDeletedDocument(owner.id);

    expect(await restoreDocument(fixture.id, other.id)).toBeUndefined();

    const document = await getDocument(fixture.id);
    expect(document?.deletedAt).toBeInstanceOf(Date);
  });

  it('returns undefined for an invalid id', async () => {
    expect(await restoreDocument('not-a-uuid', 'not-a-uuid')).toBeUndefined();
  });
});

describe('connectCollaborator', () => {
  it('connects a user to a document', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const document = await createSharedDocument(owner.id);

    const connection = await connectCollaborator({
      documentId: document.id,
      userId: collaborator.id,
    });

    expect(connection).toMatchObject({
      documentId: document.id,
      source: 'link',
      userId: collaborator.id,
    });
  });

  it('is idempotent for an existing connection', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const document = await createSharedDocument(owner.id);

    await connectCollaborator({
      documentId: document.id,
      userId: collaborator.id,
    });
    await connectCollaborator({
      documentId: document.id,
      userId: collaborator.id,
    });

    const rows = await db.query.documentCollaborators.findMany({
      where: {
        documentId: document.id,
        userId: collaborator.id,
      },
    });

    expect(rows).toHaveLength(1);
  });

  it('returns undefined for an invalid id', async () => {
    expect(await connectCollaborator({
      documentId: 'not-a-uuid',
      userId: 'not-a-uuid',
    })).toBeUndefined();
  });
});

describe('removeLinkCollaborators', () => {
  it('removes the connections made through the link', async () => {
    const owner = await createTestUser();
    const collaboratorA = await createTestUser();
    const collaboratorB = await createTestUser();
    const document = await createSharedDocument(owner.id);

    await connectCollaborator({
      documentId: document.id,
      userId: collaboratorA.id,
    });
    await connectCollaborator({
      documentId: document.id,
      userId: collaboratorB.id,
    });

    await removeLinkCollaborators(document.id);

    const rows = await db.query.documentCollaborators.findMany({
      where: {
        documentId: document.id,
      },
    });

    expect(rows).toHaveLength(0);
  });

  it('keeps the people invited by e-mail', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const document = await createSharedDocument(owner.id);

    await connectCollaborator({
      documentId: document.id,
      userId: collaborator.id,
    });
    const invite = await inviteDocumentCollaborator(
      document.id, 'invited@example.com',
    );

    await removeLinkCollaborators(document.id);

    const rows = await db.query.documentCollaborators.findMany({
      where: { documentId: document.id },
    });

    expect(rows.map(row => row.id)).toStrictEqual([invite.id]);
  });

  it('does nothing for an invalid id', async () => {
    await expect(removeLinkCollaborators('not-a-uuid'))
      .resolves.toBeUndefined();
  });
});

describe('getDocumentForViewer', () => {
  it('returns the document with the collaborator row of the viewer', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const fixture = await createSharedDocument(owner.id);

    expect(await getDocumentForViewer(fixture.id, viewerOf(collaborator)))
      .toStrictEqual({
        id: fixture.id,
        title: fixture.title,
        linkShared: true,
        linkAccess: 'view',
        userId: owner.id,
        deletedAt: null,
        collaborator: null,
      });

    const connection = await connectCollaborator({
      documentId: fixture.id,
      userId: collaborator.id,
    });

    expect(await getDocumentForViewer(fixture.id, viewerOf(collaborator)))
      .toMatchObject({
        collaborator: {
          id: connection?.id,
          source: 'link',
          userId: collaborator.id,
          email: null,
          access: null,
        },
      });
  });

  it('finds a pending invite by the address of the viewer', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    const invite = await inviteDocumentCollaborator(
      fixture.id, invitee.email, { access: 'view' },
    );

    expect(await getDocumentForViewer(fixture.id, viewerOf(invitee)))
      .toMatchObject({
        collaborator: {
          id: invite.id,
          source: 'invite',
          userId: null,
          email: invitee.email,
          access: 'view',
        },
      });
  });

  it('does not hand out somebody else\'s accepted invite by address', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const impostor = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    await inviteDocumentCollaborator(
      fixture.id, invitee.email, { userId: invitee.id, accepted: true },
    );

    expect(await getDocumentForViewer(fixture.id, {
      id: impostor.id,
      email: invitee.email,
    })).toMatchObject({ collaborator: null });
  });

  it('prefers the invite over a connection through the link', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const fixture = await createSharedDocument(owner.id);
    await connectCollaborator({
      documentId: fixture.id,
      userId: collaborator.id,
    });
    const invite = await inviteDocumentCollaborator(
      fixture.id, collaborator.email,
    );

    expect(await getDocumentForViewer(fixture.id, viewerOf(collaborator)))
      .toMatchObject({ collaborator: { id: invite.id } });
  });

  it('reports no collaborator row without a viewer', async () => {
    const owner = await createTestUser();
    const fixture = await createSharedDocument(owner.id);

    expect(await getDocumentForViewer(fixture.id))
      .toMatchObject({ collaborator: null });
    expect(await getDocumentForViewer(fixture.id, {
      id: 'not-a-uuid',
      email: owner.email,
    })).toMatchObject({ collaborator: null });
  });

  it('returns undefined for an unknown or invalid id', async () => {
    expect(await getDocumentForViewer('not-a-uuid')).toBeUndefined();
    expect(await getDocumentForViewer(crypto.randomUUID()))
      .toBeUndefined();
  });
});

describe('getInvitedCollaborators', () => {
  it('lists the invites oldest first with when they were accepted', async () => {
    const owner = await createTestUser();
    const accepted = await createTestUser();
    const linked = await createTestUser();
    const fixture = await createSharedDocument(owner.id);
    await connectCollaborator({ documentId: fixture.id, userId: linked.id });
    const first = await inviteDocumentCollaborator(
      fixture.id, accepted.email, { userId: accepted.id, accepted: true },
    );
    const second = await inviteDocumentCollaborator(
      fixture.id, 'pending@example.com', { access: 'view' },
    );

    expect(await getInvitedCollaborators(fixture.id)).toStrictEqual([
      {
        id: first.id,
        userId: accepted.id,
        email: accepted.email,
        access: 'edit',
        acceptedAt: first.acceptedAt,
        name: accepted.name,
      },
      {
        id: second.id,
        userId: null,
        email: 'pending@example.com',
        access: 'view',
        acceptedAt: null,
        name: null,
      },
    ]);
    expect(first.acceptedAt).toBeInstanceOf(Date);
  });

  it('returns an empty list for an invalid id', async () => {
    expect(await getInvitedCollaborators('not-a-uuid')).toStrictEqual([]);
  });
});

describe('inviteCollaborator', () => {
  it('records a pending invite for an address without an account', async () => {
    const owner = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);

    const invite = await inviteCollaborator({
      documentId: fixture.id,
      email: 'new@example.com',
      access: 'edit',
    });

    expect(invite).toMatchObject({
      documentId: fixture.id,
      source: 'invite',
      email: 'new@example.com',
      access: 'edit',
      userId: null,
    });
  });

  it('leaves the account unlinked until the invite is accepted', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);

    const invite = await inviteCollaborator({
      documentId: fixture.id,
      email: invitee.email,
      access: 'view',
    });

    expect(invite?.userId).toBeNull();
  });

  it('turns a connection through the link into the invite', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const fixture = await createSharedDocument(owner.id);
    const connection = await connectCollaborator({
      documentId: fixture.id,
      userId: collaborator.id,
    });

    const invite = await inviteCollaborator({
      documentId: fixture.id,
      email: collaborator.email,
      access: 'view',
      userId: collaborator.id,
    });

    expect(invite).toMatchObject({
      id: connection?.id,
      source: 'invite',
      userId: collaborator.id,
      email: collaborator.email,
      access: 'view',
    });
    expect(await db.query.documentCollaborators.findMany({
      where: { documentId: fixture.id },
    })).toHaveLength(1);
  });

  it('refuses an address that is invited already', async () => {
    const owner = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    await inviteDocumentCollaborator(fixture.id, 'twice@example.com');

    expect(await inviteCollaborator({
      documentId: fixture.id,
      email: 'twice@example.com',
      access: 'edit',
    })).toBeUndefined();
  });

  it('refuses a person who is invited already', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    await inviteDocumentCollaborator(
      fixture.id, 'old-address@example.com', { userId: invitee.id },
    );

    expect(await inviteCollaborator({
      documentId: fixture.id,
      email: invitee.email,
      access: 'edit',
      userId: invitee.id,
    })).toBeUndefined();
  });

  it('returns undefined for an invalid id', async () => {
    expect(await inviteCollaborator({
      documentId: 'not-a-uuid',
      email: 'new@example.com',
      access: 'edit',
    })).toBeUndefined();
  });
});

describe('acceptInvite', () => {
  it('ties the invite to the account and stamps when', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    const invite = await inviteDocumentCollaborator(fixture.id, invitee.email);

    const accepted = await acceptInvite({
      collaboratorId: invite.id,
      userId: invitee.id,
    });

    expect(accepted).toMatchObject({ id: invite.id, userId: invitee.id });
    expect(accepted?.acceptedAt).toBeInstanceOf(Date);
  });

  it('accepts an invite already tied to the account', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    const invite = await inviteDocumentCollaborator(
      fixture.id, invitee.email, { userId: invitee.id },
    );

    const accepted = await acceptInvite({
      collaboratorId: invite.id,
      userId: invitee.id,
    });

    expect(accepted?.acceptedAt).toBeInstanceOf(Date);
  });

  it('drops a connection the account made through the link', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const fixture = await createSharedDocument(owner.id);
    const invite = await inviteDocumentCollaborator(fixture.id, invitee.email);
    await connectCollaborator({ documentId: fixture.id, userId: invitee.id });

    await acceptInvite({ collaboratorId: invite.id, userId: invitee.id });

    const rows = await db.query.documentCollaborators.findMany({
      where: { documentId: fixture.id },
    });

    expect(rows.map(row => row.id)).toStrictEqual([invite.id]);
  });

  it('does not accept an invite twice', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const other = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    const invite = await inviteDocumentCollaborator(
      fixture.id, invitee.email, { userId: invitee.id, accepted: true },
    );

    expect(await acceptInvite({
      collaboratorId: invite.id,
      userId: other.id,
    })).toBeUndefined();
  });

  it('returns undefined for an invalid id', async () => {
    expect(await acceptInvite({
      collaboratorId: 'not-a-uuid',
      userId: 'not-a-uuid',
    })).toBeUndefined();
  });
});

describe('setCollaboratorAccess', () => {
  it('changes the access of an invite for the owner', async () => {
    const owner = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    const invite = await inviteDocumentCollaborator(
      fixture.id, 'invited@example.com', { access: 'view' },
    );

    expect(await setCollaboratorAccess({
      documentId: fixture.id,
      ownerId: owner.id,
      collaboratorId: invite.id,
      access: 'edit',
    })).toStrictEqual({ id: invite.id, userId: null, access: 'edit' });
  });

  it('refuses anybody but the owner', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    const invite = await inviteDocumentCollaborator(
      fixture.id, 'invited@example.com', { access: 'view' },
    );

    expect(await setCollaboratorAccess({
      documentId: fixture.id,
      ownerId: other.id,
      collaboratorId: invite.id,
      access: 'edit',
    })).toBeUndefined();
  });

  it('refuses a connection made through the link', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const fixture = await createSharedDocument(owner.id);
    const connection = await connectCollaborator({
      documentId: fixture.id,
      userId: collaborator.id,
    });

    expect(await setCollaboratorAccess({
      documentId: fixture.id,
      ownerId: owner.id,
      collaboratorId: connection?.id ?? '',
      access: 'edit',
    })).toBeUndefined();
  });

  it('returns undefined for an invalid id', async () => {
    expect(await setCollaboratorAccess({
      documentId: 'not-a-uuid',
      ownerId: 'not-a-uuid',
      collaboratorId: 'not-a-uuid',
      access: 'edit',
    })).toBeUndefined();
  });
});

describe('removeCollaborator', () => {
  it('deletes the row for the owner', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    const invite = await inviteDocumentCollaborator(
      fixture.id, invitee.email, { userId: invitee.id, accepted: true },
    );

    expect(await removeCollaborator({
      documentId: fixture.id,
      ownerId: owner.id,
      collaboratorId: invite.id,
    })).toStrictEqual({ id: invite.id, userId: invitee.id });
    expect(await db.query.documentCollaborators.findFirst({
      where: { id: invite.id },
    })).toBeUndefined();
  });

  it('refuses anybody but the owner', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const fixture = await createDocumentWithTitle(owner.id);
    const invite = await inviteDocumentCollaborator(
      fixture.id, 'invited@example.com',
    );

    expect(await removeCollaborator({
      documentId: fixture.id,
      ownerId: other.id,
      collaboratorId: invite.id,
    })).toBeUndefined();
    expect(await db.query.documentCollaborators.findFirst({
      where: { id: invite.id },
    })).toBeDefined();
  });

  it('returns undefined for an invalid id', async () => {
    expect(await removeCollaborator({
      documentId: 'not-a-uuid',
      ownerId: 'not-a-uuid',
      collaboratorId: 'not-a-uuid',
    })).toBeUndefined();
  });
});

describe('purgeDocumentsDeletedBefore', () => {
  const days = 24 * 60 * 60 * 1000;

  it('hard deletes documents deleted before the given date', async () => {
    const user = await createTestUser();
    const old = await createDeletedDocument(
      user.id, new Date(Date.now() - 40 * days),
    );
    const recent = await createDeletedDocument(
      user.id, new Date(Date.now() - 10 * days),
    );
    const live = await createDocumentWithTitle(user.id);

    const deletedCount = await purgeDocumentsDeletedBefore(
      new Date(Date.now() - 30 * days),
    );

    expect(deletedCount).toBeGreaterThanOrEqual(1);
    expect(await getDocument(old.id)).toBeUndefined();
    expect(await getDocument(recent.id)).toBeDefined();
    expect(await getDocument(live.id)).toBeDefined();
  });

  it('clears leftover collaborators along with the document', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const old = await createDeletedDocument(
      owner.id, new Date(Date.now() - 40 * days),
    );
    await connectDocumentCollaborator(old.id, collaborator.id);

    await purgeDocumentsDeletedBefore(new Date(Date.now() - 30 * days));

    expect(await getDocument(old.id)).toBeUndefined();
    expect(await db.query.documentCollaborators.findMany({
      where: { documentId: old.id },
    })).toHaveLength(0);
  });
});
