// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import {
  addImage,
  AddImageError,
  copyImage,
  CopyImageError,
  openAsset,
  OpenAssetError,
  signAssetUrl,
} from './asset';
import type { Config } from '~/config';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';

type CdnConfig = Config['storage']['cdn'];
const cdn = vi.hoisted(() => ({ config: undefined as CdnConfig }));
vi.mock('~/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/config')>();
  return {
    ...actual,
    getConfig: () => {
      const config = actual.getConfig();
      return { ...config, storage: { ...config.storage, cdn: cdn.config } };
    },
  };
});

const getLiveAccessMock = vi.fn();
vi.mock('~/services/document', () => ({
  getLiveAccess: (...args: unknown[]) => getLiveAccessMock(...args),
}));

const createAssetMock = vi.fn();
const getAssetMock = vi.fn();
vi.mock('~/repos/document-asset', () => ({
  createAsset: (...args: unknown[]) => createAssetMock(...args),
  getAsset: (...args: unknown[]) => getAssetMock(...args),
}));

const putObjectMock = vi.fn();
const copyObjectMock = vi.fn();
const getObjectStreamMock = vi.fn();
vi.mock('~/services/storage', () => ({
  copyObject: (...args: unknown[]) => copyObjectMock(...args),
  putObject: (...args: unknown[]) => putObjectMock(...args),
  getObjectStream: (...args: unknown[]) => getObjectStreamMock(...args),
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
  cdn.config = undefined;
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

describe('copyImage', () => {
  const sourceDocumentId = 'c4a2d3e5-0000-4000-8000-000000000000';
  const source = {
    id: 'd5b3e4f6-0000-4000-8000-000000000000',
    documentId: sourceDocumentId,
    storageKey: `documents/${sourceDocumentId}/d5b3e4f6.webp`,
    contentType: 'image/webp',
    byteSize: 1234,
    width: 800,
    height: 600,
  };
  const src = `/doc/${sourceDocumentId}/assets/${source.id}`;

  it('copies the image into the document and records it', async () => {
    getLiveAccessMock.mockResolvedValue({ readOnly: false });
    getAssetMock.mockResolvedValue(source);

    const [error, image] = await copyImage({ documentId, viewer, src });

    expect(error).toBeNull();
    expect(image).toMatchObject({ width: 800, height: 600 });
    expect(getLiveAccessMock).toHaveBeenCalledWith(documentId, viewer);
    expect(getLiveAccessMock).toHaveBeenCalledWith(sourceDocumentId, viewer);

    const storageKey = `documents/${documentId}/${image!.id}.webp`;
    expect(copyObjectMock).toHaveBeenCalledWith(source.storageKey, storageKey);
    expect(createAssetMock).toHaveBeenCalledWith({
      id: image!.id,
      documentId,
      userId: viewer.id,
      storageKey,
      contentType: 'image/webp',
      byteSize: 1234,
      width: 800,
      height: 600,
    });
  });

  it('does not copy into a document the viewer may only read', async () => {
    getLiveAccessMock.mockResolvedValue({ readOnly: true });

    const result = await copyImage({ documentId, viewer, src });

    expect(result).toEqual([CopyImageError.PermissionDenied]);
    expect(copyObjectMock).not.toHaveBeenCalled();
  });

  it('does not copy from a document the viewer may not open', async () => {
    getLiveAccessMock
      .mockResolvedValueOnce({ readOnly: false })
      .mockResolvedValueOnce(undefined);
    getAssetMock.mockResolvedValue(source);

    const result = await copyImage({ documentId, viewer, src });

    expect(result).toEqual([CopyImageError.NotFound]);
    expect(copyObjectMock).not.toHaveBeenCalled();
  });

  it('does not copy an asset under another document', async () => {
    getLiveAccessMock.mockResolvedValue({ readOnly: false });
    getAssetMock.mockResolvedValue({ ...source, documentId });

    const result = await copyImage({ documentId, viewer, src });

    expect(result).toEqual([CopyImageError.NotFound]);
    expect(copyObjectMock).not.toHaveBeenCalled();
  });

  it('does not copy what is not one of our assets', async () => {
    getLiveAccessMock.mockResolvedValue({ readOnly: false });

    const result = await copyImage({
      documentId,
      viewer,
      src: 'https://example.com/image.png',
    });

    expect(result).toEqual([CopyImageError.NotFound]);
    expect(getAssetMock).not.toHaveBeenCalled();
  });

  it('does not exist for somebody who may not open the document', async () => {
    getLiveAccessMock.mockResolvedValue(undefined);

    expect(await copyImage({ documentId, src }))
      .toEqual([CopyImageError.NotFound]);
  });
});

describe('openAsset', () => {
  const asset = {
    id: 'b3f1c2d4-0000-4000-8000-000000000000',
    documentId,
    storageKey: `documents/${documentId}/b3f1c2d4.webp`,
    contentType: 'image/webp',
    byteSize: 1234,
  };
  const body = new ReadableStream();

  it('streams the asset to somebody who may open its document', async () => {
    getAssetMock.mockResolvedValue(asset);
    getLiveAccessMock.mockResolvedValue({ readOnly: true });
    getObjectStreamMock.mockResolvedValue(body);

    const result = await openAsset(documentId, asset.id, viewer);

    expect(result).toEqual([null, {
      contentType: 'image/webp',
      byteSize: 1234,
      body,
    }]);
    expect(getLiveAccessMock).toHaveBeenCalledWith(documentId, viewer);
    expect(getObjectStreamMock).toHaveBeenCalledWith(asset.storageKey);
  });

  it('signs a CDN URL instead of streaming when there is a CDN', async () => {
    cdn.config = { url: 'https://cdn.example', tokenKey: 'key' };
    getAssetMock.mockResolvedValue(asset);
    getLiveAccessMock.mockResolvedValue({ readOnly: true });

    const [error, opened] = await openAsset(documentId, asset.id, viewer);

    expect(error).toBeNull();
    expect(opened).toMatchObject({
      url: expect.stringMatching(
        `^https://cdn.example/${asset.storageKey}\\?token=HS256-`,
      ),
    });
    expect(getObjectStreamMock).not.toHaveBeenCalled();
  });

  it('does not exist for somebody who may not open the document', async () => {
    getAssetMock.mockResolvedValue(asset);
    getLiveAccessMock.mockResolvedValue(undefined);

    const result = await openAsset(documentId, asset.id, viewer);

    expect(result).toEqual([OpenAssetError.NotFound]);
    expect(getObjectStreamMock).not.toHaveBeenCalled();
  });

  it('does not exist under another document', async () => {
    getAssetMock.mockResolvedValue(asset);
    getLiveAccessMock.mockResolvedValue({ readOnly: false });

    const result = await openAsset(
      'c4a2d3e5-0000-4000-8000-000000000000',
      asset.id,
      viewer,
    );

    expect(result).toEqual([OpenAssetError.NotFound]);
    expect(getLiveAccessMock).not.toHaveBeenCalled();
    expect(getObjectStreamMock).not.toHaveBeenCalled();
  });

  it('does not exist when there is no such asset', async () => {
    getAssetMock.mockResolvedValue(undefined);

    expect(await openAsset(documentId, asset.id))
      .toEqual([OpenAssetError.NotFound]);
  });

  it('does not exist when the bucket has lost the file', async () => {
    getAssetMock.mockResolvedValue(asset);
    getLiveAccessMock.mockResolvedValue({ readOnly: false });
    getObjectStreamMock.mockResolvedValue(undefined);

    expect(await openAsset(documentId, asset.id))
      .toEqual([OpenAssetError.NotFound]);
  });
});

describe('signAssetUrl', () => {
  const cdnConfig = { url: 'https://cdn.example', tokenKey: 'key' };
  const key = 'documents/a/b.webp';

  it('hands out the same URL for the whole window', () => {
    const start = signAssetUrl(key, cdnConfig, 1_800_000_000_000);
    const end = signAssetUrl(key, cdnConfig, 1_800_000_299_000);

    expect(end.url).toBe(start.url);
    expect(start.url).toMatch(/&expires=1800000600$/);
  });

  it('may be kept until the window ends', () => {
    expect(signAssetUrl(key, cdnConfig, 1_800_000_000_000).maxAge).toBe(300);
    expect(signAssetUrl(key, cdnConfig, 1_800_000_299_000).maxAge).toBe(1);
  });

  it('hands out a new URL in the next window', () => {
    const next = signAssetUrl(key, cdnConfig, 1_800_000_300_000);

    expect(next.url).toMatch(/&expires=1800000900$/);
  });
});
