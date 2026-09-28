import { randomUUID } from 'node:crypto';
import {
  IMAGE_CONTENT_TYPE,
  MAX_ASSET_UPLOAD_BYTES,
  SIGNED_ASSET_URL_WINDOW_SECONDS,
} from '~/constants/asset';
import { getConfig, type Config } from '~/config';
import { createAsset, getAsset } from '~/repos/document-asset';
import { getLiveAccess, type DocumentViewer } from '~/services/document';
import { copyObject, getObjectStream, putObject } from '~/services/storage';
import { parseAssetSrc } from '~/utils/asset-src';
import { signBunnyUrl } from '~/utils/bunny-token';
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

export enum CopyImageError {
  NotFound,
  PermissionDenied,
}

export interface CopyImageInput {
  documentId: string;
  viewer?: DocumentViewer;
  /** Where the image is served from in the document it was pasted from. */
  src: string;
}

export type CopyImageResult = [CopyImageError] | [null, AddedImage];

/**
 * Copies an image pasted from another document into this one, so each
 * document keeps owning its files: the image stays for whoever may open
 * this document, and goes when this document is purged, not the other
 * one. Only somebody who may edit this document and open the other one
 * may copy.
 */
export async function copyImage(
  input: CopyImageInput,
): Promise<CopyImageResult> {
  const { documentId, viewer, src } = input;
  const access = await getLiveAccess(documentId, viewer);

  if (!access) {
    return [CopyImageError.NotFound];
  }

  if (access.readOnly) {
    return [CopyImageError.PermissionDenied];
  }

  const source = parseAssetSrc(src);
  const asset = source && await getAsset(source.assetId);

  if (
    !asset
    || asset.documentId !== source.documentId
    || !await getLiveAccess(asset.documentId, viewer)
  ) {
    return [CopyImageError.NotFound];
  }

  const id = randomUUID();
  const storageKey = `documents/${documentId}/${id}.webp`;

  await copyObject(asset.storageKey, storageKey);

  await createAsset({
    id,
    documentId,
    userId: viewer?.id,
    storageKey,
    contentType: asset.contentType,
    byteSize: asset.byteSize,
    width: asset.width,
    height: asset.height,
  });

  return [null, { id, width: asset.width, height: asset.height }];
}

export enum OpenAssetError {
  NotFound,
}

export interface StreamedAsset {
  contentType: string;
  byteSize: number;
  body: ReadableStream<Uint8Array>;
}

export interface SignedAsset {
  url: string;
  /** How long, in seconds, a browser may keep redirecting to `url`. */
  maxAge: number;
}

export type OpenAsset = StreamedAsset | SignedAsset;

export type OpenAssetResult = [OpenAssetError] | [null, OpenAsset];

/**
 * An asset is for whoever may open its document, by the same rules as the
 * document itself, and only under that document. Anybody else is told it
 * does not exist, whether it does or not.
 */
export async function openAsset(
  documentId: string,
  assetId: string,
  viewer?: DocumentViewer,
): Promise<OpenAssetResult> {
  const asset = await getAsset(assetId);

  if (
    !asset
    || asset.documentId !== documentId
    || !await getLiveAccess(documentId, viewer)
  ) {
    return [OpenAssetError.NotFound];
  }

  const { cdn } = getConfig().storage;

  if (cdn) {
    return [null, signAssetUrl(asset.storageKey, cdn)];
  }

  const body = await getObjectStream(asset.storageKey);

  if (!body) {
    return [OpenAssetError.NotFound];
  }

  return [null, {
    contentType: asset.contentType,
    byteSize: asset.byteSize,
    body,
  }];
}

/**
 * A URL of the object on the CDN that loads until the end of the window
 * after the current one (see `SIGNED_ASSET_URL_WINDOW_SECONDS`), and may be
 * redirected to until the current one ends.
 */
export function signAssetUrl(
  storageKey: string,
  cdn: NonNullable<Config['storage']['cdn']>,
  now = Date.now(),
): SignedAsset {
  const window = SIGNED_ASSET_URL_WINDOW_SECONDS;
  const seconds = Math.floor(now / 1000);
  const windowEnd = (Math.floor(seconds / window) + 1) * window;

  const url = new URL(storageKey, cdn.url);

  return {
    url: signBunnyUrl(url, cdn.tokenKey, windowEnd + window),
    maxAge: windowEnd - seconds,
  };
}
