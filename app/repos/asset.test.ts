import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createAsset,
  deleteAssetsOfDocuments,
  getAsset,
  getAssetsOfDocuments,
} from './asset';
import { createTestAsset } from '~/test/data-factories/asset';
import { createDocumentWithTitle } from '~/test/data-factories/document';
import { createTestUser } from '~/test/data-factories/user';

describe('createAsset', () => {
  it('stores an asset of a document', async () => {
    const user = await createTestUser();
    const document = await createDocumentWithTitle(user.id);
    const id = randomUUID();

    const asset = await createAsset({
      id,
      documentId: document.id,
      userId: user.id,
      storageKey: `documents/${document.id}/${id}.webp`,
      contentType: 'image/webp',
      byteSize: 1234,
      width: 800,
      height: 600,
    });

    expect(asset).toMatchObject({
      id,
      documentId: document.id,
      userId: user.id,
      width: 800,
      height: 600,
    });
  });

  it('stores an asset without an uploader', async () => {
    const user = await createTestUser();
    const document = await createDocumentWithTitle(user.id);
    const id = randomUUID();

    const asset = await createAsset({
      id,
      documentId: document.id,
      storageKey: `documents/${document.id}/${id}.webp`,
      contentType: 'image/webp',
      byteSize: 1234,
      width: 800,
      height: 600,
    });

    expect(asset.userId).toBeNull();
  });
});

describe('getAsset', () => {
  it('finds an asset by id', async () => {
    const user = await createTestUser();
    const document = await createDocumentWithTitle(user.id);
    const asset = await createTestAsset(document.id, user.id);

    expect(await getAsset(asset.id)).toEqual(asset);
  });

  it('returns undefined for an unknown or malformed id', async () => {
    expect(await getAsset(randomUUID())).toBeUndefined();
    expect(await getAsset('not-a-uuid')).toBeUndefined();
  });
});

describe('getAssetsOfDocuments', () => {
  it('lists the assets of the given documents only', async () => {
    const user = await createTestUser();
    const document = await createDocumentWithTitle(user.id);
    const other = await createDocumentWithTitle(user.id);
    const asset = await createTestAsset(document.id);
    await createTestAsset(other.id);

    expect(await getAssetsOfDocuments([document.id])).toEqual([asset]);
  });

  it('returns nothing without ids', async () => {
    expect(await getAssetsOfDocuments([])).toEqual([]);
  });
});

describe('deleteAssetsOfDocuments', () => {
  it('deletes the assets of the given documents only', async () => {
    const user = await createTestUser();
    const document = await createDocumentWithTitle(user.id);
    const other = await createDocumentWithTitle(user.id);
    const asset = await createTestAsset(document.id);
    const kept = await createTestAsset(other.id);

    await deleteAssetsOfDocuments([document.id]);

    expect(await getAsset(asset.id)).toBeUndefined();
    expect(await getAsset(kept.id)).toEqual(kept);
  });
});
