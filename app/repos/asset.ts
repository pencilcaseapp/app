import { inArray, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { assets } from '~/db/schema';

export type Asset = InferSelectModel<typeof assets>;

export interface CreateAssetInput {
  id: string;
  documentId: string;
  userId?: string;
  storageKey: string;
  contentType: string;
  byteSize: number;
  width: number;
  height: number;
}

export async function createAsset(input: CreateAssetInput) {
  const [asset] = await db.insert(assets).values(input).returning();

  return asset;
}

export async function getAsset(id: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  return db.query.assets.findFirst({ where: { id } });
}

export async function getAssetsOfDocuments(documentIds: string[]) {
  if (documentIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(assets)
    .where(inArray(assets.documentId, documentIds));
}

export async function deleteAssetsOfDocuments(documentIds: string[]) {
  if (documentIds.length === 0) {
    return;
  }

  await db.delete(assets).where(inArray(assets.documentId, documentIds));
}
