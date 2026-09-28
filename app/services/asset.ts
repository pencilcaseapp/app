import { randomUUID } from 'node:crypto';
import { IMAGE_CONTENT_TYPE, MAX_ASSET_UPLOAD_BYTES } from '~/constants/asset';
import { createAsset, getAsset } from '~/repos/asset';
import { getLiveAccess, type DocumentViewer } from '~/services/document';
import { getObjectStream, putObject } from '~/services/storage';
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

export enum OpenAssetError {
  NotFound,
}

export interface OpenAsset {
  contentType: string;
  byteSize: number;
  body: ReadableStream<Uint8Array>;
}

export type OpenAssetResult = [OpenAssetError] | [null, OpenAsset];

/**
 * An asset is for whoever may open its document, by the same rules as the
 * document itself. Anybody else is told it does not exist, whether it does
 * or not.
 */
export async function openAsset(
  assetId: string,
  viewer?: DocumentViewer,
): Promise<OpenAssetResult> {
  const asset = await getAsset(assetId);

  if (!asset || !await getLiveAccess(asset.documentId, viewer)) {
    return [OpenAssetError.NotFound];
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
