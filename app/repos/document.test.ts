import { describe, expect, it } from 'vitest';
import { connectCollaborator, createDocument, getDocument, getDocumentForViewer, getDocumentList, getDocumentTitle, removeCollaboratorsForDocument, setDocumentShared, updateDocument } from './document';
import { db } from '~/db';
import { connectDocumentCollaborator, createDocumentWithTitle, createEmptyDocument, createSharedDocument } from '~/test/data-factories/document';
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
      },
      {
        id: document1.id,
        title: document1.title,
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
    });
    expect(documents).toContainEqual({
      id: sharedDocument.id,
      title: sharedDocument.title,
    });
  });

  it('does not duplicate a document that is both owned and connected', async () => {
    const user = await createTestUser();
    const document = await createSharedDocument(user.id);
    await connectDocumentCollaborator(document.id, user.id);

    const documents = await getDocumentList(user.id);

    expect(documents.filter(item => item.id === document.id)).toHaveLength(1);
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
