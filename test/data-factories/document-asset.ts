import { faker } from '@faker-js/faker';
import { db } from '~/db';
import { documentAssets } from '~/db/schema';

export async function createTestAsset(documentId: string, userId?: string) {
  const id = faker.string.uuid();
  const [asset] = await db.insert(documentAssets).values({
    id,
    documentId,
    userId,
    storageKey: `documents/${documentId}/${id}.webp`,
    contentType: 'image/webp',
    byteSize: faker.number.int({ min: 1_000, max: 500_000 }),
    width: faker.number.int({ min: 10, max: 1600 }),
    height: faker.number.int({ min: 10, max: 1600 }),
  }).returning();

  return asset;
}
