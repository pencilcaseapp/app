import { randomUUID } from 'node:crypto';
import { LRUCache } from 'lru-cache';
import {
  ASSET_CACHE_BYTES,
  IMAGE_CONTENT_TYPE,
  MAX_ASSET_UPLOAD_BYTES,
} from '~/constants/asset';
import { createAsset, getAsset, type Asset } from '~/repos/asset';
import { getLiveAccess, type DocumentViewer } from '~/services/document';
import { getObject, putObject } from '~/services/storage';
import { processImage } from '~/utils/image';

export enum AddImageError {
  NotFound,
  PermissionDenied,
  TooLarge,
  UnsupportedType,
}

export interface AddImageInput {
  documentId: string;
  viewer?: DocumentViewer;
  file: File;
}

export interface AddedImage {
  id: string;
  width: number;
  height: number;
}

export type AddImageResult = [AddImageError] | [null, AddedImage];

/**
 * Stores an image somebody dropped or pasted into a document. Only
 * somebody who may edit the document may add to it, and the image is
 * stored processed (see `processImage`), never as uploaded.
 */
export async function addImage(input: AddImageInput): Promise<AddImageResult> {
  const { documentId, viewer, file } = input;
  const access = await getLiveAccess(documentId, viewer);

  if (!access) {
    return [AddImageError.NotFound];
  }

  if (access.readOnly) {
    return [AddImageError.PermissionDenied];
  }

  if (file.size > MAX_ASSET_UPLOAD_BYTES) {
    return [AddImageError.TooLarge];
  }

  const image = await processImage(new Uint8Array(await file.arrayBuffer()));

  if (!image) {
    return [AddImageError.UnsupportedType];
  }

  const id = randomUUID();
  const storageKey = `documents/${documentId}/${id}.webp`;

  await putObject({
    key: storageKey,
    body: image.data,
    contentType: IMAGE_CONTENT_TYPE,
  });

  await createAsset({
    id,
    documentId,
    userId: viewer?.id,
    storageKey,
    contentType: IMAGE_CONTENT_TYPE,
    byteSize: image.data.byteLength,
    width: image.width,
    height: image.height,
  });

  return [null, { id, width: image.width, height: image.height }];
}

export enum FindAssetError {
  NotFound,
}

export type FindAssetResult = [FindAssetError] | [null, Asset];

/**
 * An asset is for whoever may open its document, by the same rules as the
 * document itself. Anybody else is told it does not exist, whether it does
 * or not.
 */
export async function findAsset(
  assetId: string,
  viewer?: DocumentViewer,
): Promise<FindAssetResult> {
  const asset = await getAsset(assetId);

  if (!asset || !await getLiveAccess(asset.documentId, viewer)) {
    return [FindAssetError.NotFound];
  }

  return [null, asset];
}

/*
 * An asset never changes once it is stored, so an instance keeps the ones
 * it served lately in memory and only goes to the bucket, by far the
 * slowest part of serving one, for the rest. Only ever read after
 * `findAsset`, so access is still checked on every request.
 */
const cache = new LRUCache<string, Uint8Array<ArrayBuffer>>({
  maxSize: ASSET_CACHE_BYTES,
  sizeCalculation: body => body.byteLength,
  fetchMethod: key => getObject(key),
});

/** The asset's content, or `undefined` when the bucket has lost it. */
export async function readAsset(asset: Asset) {
  return cache.fetch(asset.storageKey);
}
