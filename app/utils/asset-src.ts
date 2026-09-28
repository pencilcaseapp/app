const ASSET_SRC
  = /^\/doc\/([0-9a-f-]{36})\/assets\/([0-9a-f-]{36})$/;

export interface AssetSrc {
  documentId: string;
  assetId: string;
}

/**
 * The document and asset an image's `src` points at, or `undefined` when
 * it is not one of our assets.
 */
export function parseAssetSrc(src: string): AssetSrc | undefined {
  const match = ASSET_SRC.exec(src);

  if (!match) {
    return undefined;
  }

  return { documentId: match[1], assetId: match[2] };
}
