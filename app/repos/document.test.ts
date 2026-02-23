import { describe, expect, it } from 'vitest';
import { createDocument, getDocument, updateDocument } from './document';
import { db } from '~/db';
import { createEmptyDocument } from '~/test/fixtures/document';

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
    });
  });
});

describe('getDocument', () => {
  it('returns a document by id', async () => {
    const fixture = await createEmptyDocument();
    const document = await getDocument(fixture.id);

    expect(document).toStrictEqual(fixture);
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
    });
  });
});
