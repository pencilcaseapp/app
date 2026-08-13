import { describe, expect, it } from 'vitest';
import { createDocument, getDocument, getDocumentList, getDocumentTitle, setDocumentShared, updateDocument } from './document';
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
  it('toggles the shared flag', async () => {
    const user = await createTestUser();
    const fixture = await createEmptyDocument(user.id);

    const shared = await setDocumentShared(fixture.id, true);
    expect(shared?.shared).toBe(true);

    const unshared = await setDocumentShared(fixture.id, false);
    expect(unshared?.shared).toBe(false);
  });

  it('returns undefined for an invalid id', async () => {
    expect(await setDocumentShared('not-a-uuid', true)).toBeUndefined();
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
