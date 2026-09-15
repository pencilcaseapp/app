import { describe, expect, it } from 'vitest';
import {
  connectCollaborator,
  createDocument,
  getDeletedDocumentList,
  getDocument,
  getDocumentForViewer,
  getDocumentList,
  getDocumentTitle,
  purgeDocumentsDeletedBefore,
  removeCollaboratorsForDocument,
  restoreDocument,
  setDocumentShared,
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
} from '~/test/data-factories/document';
import { createTestUser } from '~/test/data-factories/user';

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
      shared: false,
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
      shared: false,
      createdAt: fixture.createdAt,
      updatedAt: expect.any(Date),
      deletedAt: null,
      userId: user.id,
    });
  });
});

describe('setDocumentShared', () => {
  it('toggles the shared flag for the owner', async () => {
    const user = await createTestUser();
    const fixture = await createEmptyDocument(user.id);

    const shared = await setDocumentShared({
      documentId: fixture.id,
      ownerId: user.id,
      shared: true,
    });
    expect(shared?.shared).toBe(true);

    const unshared = await setDocumentShared({
      documentId: fixture.id,
      ownerId: user.id,
      shared: false,
    });
    expect(unshared?.shared).toBe(false);
  });

  it('does not count as an edit', async () => {
    const user = await createTestUser();
    const fixture = await createDocumentWithTitle(user.id);

    await setDocumentShared({
      documentId: fixture.id,
      ownerId: user.id,
      shared: true,
    });

    const document = await getDocument(fixture.id);
    expect(document?.updatedAt).toStrictEqual(fixture.updatedAt);
  });

  it('keeps the document in its place in the navigation', async () => {
    const user = await createTestUser();
    const older = await createDocumentWithTitle(user.id);
    const newer = await createDocumentWithTitle(user.id);

    await setDocumentShared({
      documentId: older.id,
      ownerId: user.id,
      shared: true,
    });

    expect((await getDocumentList(user.id)).map(item => item.id))
      .toStrictEqual([newer.id, older.id]);
  });

  it('returns undefined for somebody who is not the owner', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const fixture = await createEmptyDocument(owner.id);

    expect(await setDocumentShared({
      documentId: fixture.id,
      ownerId: other.id,
      shared: true,
    })).toBeUndefined();

    const document = await getDocument(fixture.id);
    expect(document?.shared).toBe(false);
  });

  it('returns undefined for a deleted document', async () => {
    const user = await createTestUser();
    const fixture = await createDeletedDocument(user.id);

    expect(await setDocumentShared({
      documentId: fixture.id,
      ownerId: user.id,
      shared: true,
    })).toBeUndefined();

    const document = await getDocument(fixture.id);
    expect(document?.shared).toBe(false);
  });

  it('returns undefined for an invalid id', async () => {
    expect(await setDocumentShared({
      documentId: 'not-a-uuid',
      ownerId: 'not-a-uuid',
      shared: true,
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
        shared: false,
        userId: user.id,
      },
      {
        id: document1.id,
        title: document1.title,
        shared: false,
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
      shared: false,
      userId: collaborator.id,
    });
    expect(documents).toContainEqual({
      id: sharedDocument.id,
      title: sharedDocument.title,
      shared: true,
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
        shared: false,
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
    expect(document?.shared).toBe(false);
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
    expect(document?.shared).toBe(true);
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
    expect(document?.shared).toBe(false);
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

describe('removeCollaboratorsForDocument', () => {
  it('removes every collaborator connection for a document', async () => {
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

    await removeCollaboratorsForDocument(document.id);

    const rows = await db.query.documentCollaborators.findMany({
      where: {
        documentId: document.id,
      },
    });

    expect(rows).toHaveLength(0);
  });
});

describe('getDocumentForViewer', () => {
  it('returns the document with the collaborator status', async () => {
    const owner = await createTestUser();
    const collaborator = await createTestUser();
    const fixture = await createSharedDocument(owner.id);

    expect(await getDocumentForViewer(fixture.id, collaborator.id))
      .toStrictEqual({
        id: fixture.id,
        title: fixture.title,
        shared: true,
        userId: owner.id,
        deletedAt: null,
        isCollaborator: false,
      });

    await connectCollaborator({
      documentId: fixture.id,
      userId: collaborator.id,
    });

    expect(await getDocumentForViewer(fixture.id, collaborator.id))
      .toMatchObject({ isCollaborator: true });
  });

  it('reports no collaborator status without a viewer', async () => {
    const owner = await createTestUser();
    const fixture = await createSharedDocument(owner.id);

    expect(await getDocumentForViewer(fixture.id))
      .toMatchObject({ isCollaborator: false });
    expect(await getDocumentForViewer(fixture.id, 'not-a-uuid'))
      .toMatchObject({ isCollaborator: false });
  });

  it('returns undefined for an unknown or invalid id', async () => {
    expect(await getDocumentForViewer('not-a-uuid')).toBeUndefined();
    expect(await getDocumentForViewer(crypto.randomUUID()))
      .toBeUndefined();
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
