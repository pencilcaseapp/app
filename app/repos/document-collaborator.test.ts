import { describe, expect, it } from 'vitest';
import { connectCollaborator, removeCollaboratorsForDocument } from './document-collaborator';
import { db } from '~/db';
import { createSharedDocument } from '~/test/data-factories/document';
import { createTestUser } from '~/test/data-factories/user';

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
