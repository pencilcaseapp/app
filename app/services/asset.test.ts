// @vitest-environment node

import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import {
  addImage,
  AddImageError,
  findAsset,
  FindAssetError,
  readAsset,
} from './asset';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';

const getLiveAccessMock = vi.fn();
vi.mock('~/services/document', () => ({
  getLiveAccess: (...args: unknown[]) => getLiveAccessMock(...args),
}));

const createAssetMock = vi.fn();
const getAssetMock = vi.fn();
vi.mock('~/repos/asset', () => ({
  createAsset: (...args: unknown[]) => createAssetMock(...args),
  getAsset: (...args: unknown[]) => getAssetMock(...args),
}));

const putObjectMock = vi.fn();
const getObjectMock = vi.fn();
vi.mock('~/services/storage', () => ({
  putObject: (...args: unknown[]) => putObjectMock(...args),
  getObject: (...args: unknown[]) => getObjectMock(...args),
}));

const viewer = { id: userFixture.id, email: userFixture.email };
const documentId = documentFixture.id;

async function createPng(width: number, height: number) {
  const data = await sharp({
    create: { width, height, channels: 3, background: '#39f' },
  }).png().toBuffer();

  return new File([new Uint8Array(data)], 'image.png', { type: 'image/png' });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('addImage', () => {
  it('stores the processed image and records it', async () => {
    getLiveAccessMock.mockResolvedValue({ readOnly: false });

    const [error, image] = await addImage({
      documentId,
      viewer,
      file: await createPng(2000, 1000),
    });

    expect(error).toBeNull();
    expect(image).toMatchObject({ width: 1600, height: 800 });
    expect(getLiveAccessMock).toHaveBeenCalledWith(documentId, viewer);

    const storageKey = `documents/${documentId}/${image!.id}.webp`;
    expect(putObjectMock).toHaveBeenCalledWith({
      key: storageKey,
      body: expect.any(Uint8Array),
      contentType: 'image/webp',
    });
    expect(createAssetMock).toHaveBeenCalledWith({
      id: image!.id,
      documentId,
      userId: viewer.id,
      storageKey,
      contentType: 'image/webp',
      byteSize: putObjectMock.mock.calls[0][0].body.byteLength,
      width: 1600,
      height: 800,
    });
  });

  it('stores an image of a signed out editor without an uploader', async () => {
    getLiveAccessMock.mockResolvedValue({ readOnly: false });

    await addImage({ documentId, file: await createPng(10, 10) });

    expect(createAssetMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined }),
    );
  });

  it('refuses somebody without access', async () => {
    getLiveAccessMock.mockResolvedValue(undefined);

    const result = await addImage({
      documentId,
      viewer,
      file: await createPng(10, 10),
    });

    expect(result).toEqual([AddImageError.NotFound]);
    expect(putObjectMock).not.toHaveBeenCalled();
  });

  it('refuses somebody who may only read', async () => {
    getLiveAccessMock.mockResolvedValue({ readOnly: true });

    const result = await addImage({
      documentId,
      viewer,
      file: await createPng(10, 10),
    });

    expect(result).toEqual([AddImageError.PermissionDenied]);
    expect(putObjectMock).not.toHaveBeenCalled();
  });

  it('refuses a file over 10 MB', async () => {
    getLiveAccessMock.mockResolvedValue({ readOnly: false });
    const file = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      'huge.png',
      { type: 'image/png' },
    );

    const result = await addImage({ documentId, viewer, file });

    expect(result).toEqual([AddImageError.TooLarge]);
    expect(putObjectMock).not.toHaveBeenCalled();
  });

  it('refuses a file that is not an accepted image', async () => {
    getLiveAccessMock.mockResolvedValue({ readOnly: false });
    const file = new File(['<svg></svg>'], 'image.png', {
      type: 'image/png',
    });

    const result = await addImage({ documentId, viewer, file });

    expect(result).toEqual([AddImageError.UnsupportedType]);
    expect(putObjectMock).not.toHaveBeenCalled();
    expect(createAssetMock).not.toHaveBeenCalled();
  });
});

describe('findAsset', () => {
  const asset = {
    id: 'b3f1c2d4-0000-4000-8000-000000000000',
    documentId,
    storageKey: `documents/${documentId}/b3f1c2d4.webp`,
    contentType: 'image/webp',
    byteSize: 1234,
  };

  it('finds the asset for somebody who may open its document', async () => {
    getAssetMock.mockResolvedValue(asset);
    getLiveAccessMock.mockResolvedValue({ readOnly: true });

    expect(await findAsset(asset.id, viewer)).toEqual([null, asset]);
    expect(getLiveAccessMock).toHaveBeenCalledWith(documentId, viewer);
  });

  it('does not exist for somebody who may not open the document', async () => {
    getAssetMock.mockResolvedValue(asset);
    getLiveAccessMock.mockResolvedValue(undefined);

    const result = await findAsset(asset.id, viewer);

    expect(result).toEqual([FindAssetError.NotFound]);
  });

  it('does not exist when there is no such asset', async () => {
    getAssetMock.mockResolvedValue(undefined);

    expect(await findAsset(asset.id)).toEqual([FindAssetError.NotFound]);
  });
});

describe('readAsset', () => {
  const body = new TextEncoder().encode('image');

  function createAsset() {
    const id = randomUUID();

    return {
      id,
      documentId,
      userId: null,
      storageKey: `documents/${documentId}/${id}.webp`,
      contentType: 'image/webp',
      byteSize: body.byteLength,
      width: 10,
      height: 10,
      createdAt: new Date(),
    };
  }

  it('reads the asset from the bucket once and then from memory', async () => {
    const asset = createAsset();
    getObjectMock.mockResolvedValue(body);

    expect(await readAsset(asset)).toBe(body);
    expect(await readAsset(asset)).toBe(body);
    expect(getObjectMock).toHaveBeenCalledOnce();
    expect(getObjectMock).toHaveBeenCalledWith(asset.storageKey);
  });

  it('asks the bucket once for requests arriving together', async () => {
    const asset = createAsset();
    getObjectMock.mockResolvedValue(body);

    await Promise.all([readAsset(asset), readAsset(asset)]);

    expect(getObjectMock).toHaveBeenCalledOnce();
  });

  it('is undefined when the bucket has lost the file', async () => {
    const asset = createAsset();
    getObjectMock.mockResolvedValue(undefined);

    expect(await readAsset(asset)).toBeUndefined();
  });
});
