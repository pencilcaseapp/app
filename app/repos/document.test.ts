import { describe, expect, it } from 'vitest';
import { createDocument, getDocument, getDocumentList, getDocumentTitle, updateDocument } from './document';
import { db } from '~/db';
import { createDocumentWithTitle, createEmptyDocument } from '~/test/data-factories/document';
import { createTestUser } from '~/test/data-factories/user';

describe('createDocument', () => {
  it('creates an empty document', async () => {
    const document = await createDocument();
    const dbDocument = await db.query.documents.findFirst({
      where: {
        id: document.id,
      },
    });

    expect(dbDocument).toStrictEqual({
      id: document.id,
      title: null,
      content: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      userId: null,
    });
  });

  it('sets document owner', async () => {
    const user = await createTestUser();
    const document = await createDocument({
      userId: user.id,
    });
    const dbDocument = await db.query.documents.findFirst({
      where: {
        id: document.id,
      },
    });

    expect(dbDocument).toEqual(
      expect.objectContaining({
        userId: user.id,
      }),
    );
  });
});

describe('getDocument', () => {
  it('returns a document by id', async () => {
    const fixture = await createEmptyDocument();
    const document = await getDocument(fixture.id);

    expect(document).toStrictEqual(fixture);
  });
});

describe('getDocumentTitle', () => {
  it('returns a document title by id', async () => {
    const fixture = await createDocumentWithTitle();
    const documentTitle = await getDocumentTitle(fixture.id);

    expect(documentTitle).toBe(fixture.title);
  });
});

describe('updateDocument', () => {
  it('updates a document', async () => {
    const fixture = await createEmptyDocument();

    const updatedDocument = await updateDocument(fixture.id, {
      title: 'Test Document',
      content: Buffer.from('Hello, World!'),
    });

    expect(updatedDocument).toStrictEqual({
      id: fixture.id,
      title: 'Test Document',
      content: Buffer.from('Hello, World!'),
      createdAt: fixture.createdAt,
      updatedAt: expect.any(Date),
      userId: null,
    });
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
});
