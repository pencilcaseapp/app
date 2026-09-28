/** The largest file anyone may add to a document, before it is processed. */
export const MAX_ASSET_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Stored images are scaled down to this width: a bit over twice the
 * 730px content column, so they stay sharp on a high density screen.
 */
export const MAX_IMAGE_WIDTH = 1600;

/** What every image is stored as, whatever it was uploaded as. */
export const IMAGE_CONTENT_TYPE = 'image/webp';

/**
 * A small file can still decode to a huge bitmap. This lets a 48 megapixel
 * phone photo through and keeps anything bigger from taking the memory of
 * the instance.
 */
export const MAX_IMAGE_PIXELS = 50_000_000;

/**
 * Signed asset URLs are handed out per window of this many seconds and
 * stay valid for two, so everybody gets the same URL for a while (and the
 * caches keep working) and a redirect is never followed with less than a
 * window left. It is also how long a revoked reader keeps loading images.
 */
export const SIGNED_ASSET_URL_WINDOW_SECONDS = 5 * 60;
