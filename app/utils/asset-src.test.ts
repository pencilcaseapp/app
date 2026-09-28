import { describe, expect, it } from 'vitest';
import { parseAssetSrc } from './asset-src';

const documentId = 'a1e0b1c3-0000-4000-8000-000000000000';
const assetId = 'b3f1c2d4-0000-4000-8000-000000000000';

describe('parseAssetSrc', () => {
  it('reads the document and asset out of our own src', () => {
    expect(parseAssetSrc(`/doc/${documentId}/assets/${assetId}`))
      .toEqual({ documentId, assetId });
  });

  it.each([
    '',
    `https://example.com/doc/${documentId}/assets/${assetId}`,
    `/doc/${documentId}/assets/${assetId}?x=1`,
    `/doc/${documentId}/assets/copies`,
    `/user-assets/${assetId}`,
  ])('knows nothing of %j', (src) => {
    expect(parseAssetSrc(src)).toBeUndefined();
  });
});
