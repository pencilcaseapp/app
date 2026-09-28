import sharp, { type Metadata, type WebpOptions } from 'sharp';
import { MAX_IMAGE_PIXELS, MAX_IMAGE_WIDTH } from '~/constants/asset';

export interface ProcessedImage {
  data: Uint8Array;
  width: number;
  height: number;
}

/*
 * What an upload may be, told from its bytes rather than from its name or
 * the type the browser claims. SVG can carry script and would be served
 * from our own origin; HEIC is something sharp's prebuilt binary cannot
 * read.
 */
const ACCEPTED_FORMATS = ['jpeg', 'png', 'webp', 'gif'];

/*
 * A PNG is mostly a screenshot or a graphic: text and hard edges, which a
 * lossy encoder smears. Those are kept lossless, which a screenshot
 * survives at a few hundred kilobytes; a photo that happens to be a PNG
 * would not, so past `MAX_LOSSLESS_BYTES` it is encoded like any photo.
 * Smart subsampling keeps coloured edges from bleeding in photos.
 */
const LOSSLESS: WebpOptions = { lossless: true };
const LOSSY: WebpOptions = { quality: 85, smartSubsample: true };
const MAX_LOSSLESS_BYTES = 1024 * 1024;

/**
 * Turns an upload into the one form images are stored in: upright, without
 * the metadata a camera writes (the location among it), no wider than
 * `MAX_IMAGE_WIDTH` and encoded as WebP, which keeps an animated GIF
 * animated. `undefined` when the bytes are not an image we accept.
 */
export async function processImage(
  input: Uint8Array,
): Promise<ProcessedImage | undefined> {
  const options = { limitInputPixels: MAX_IMAGE_PIXELS };

  try {
    const metadata = await sharp(input, options).metadata();

    if (!isAccepted(metadata)) {
      return undefined;
    }

    const isScaledDown = metadata.autoOrient.width > MAX_IMAGE_WIDTH;
    const encode = (webp: WebpOptions) => {
      const image = sharp(input, { ...options, animated: true })
        .rotate()
        .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });

      // Scaling down softens edges; this gives text back its crispness.
      return (isScaledDown ? image.sharpen({ sigma: 0.5 }) : image)
        .webp({ effort: 2, ...webp })
        .toBuffer({ resolveWithObject: true });
    };

    let { data, info } = await encode(
      metadata.format === 'png' ? LOSSLESS : LOSSY,
    );

    if (data.length > MAX_LOSSLESS_BYTES && metadata.format === 'png') {
      ({ data, info } = await encode(LOSSY));
    }

    return {
      data: new Uint8Array(data),
      width: info.width,
      height: info.pageHeight ?? info.height,
    };
  }
  catch {
    return undefined;
  }
}

function isAccepted(metadata: Metadata) {
  if (metadata.format === 'heif') {
    return metadata.compression === 'av1';
  }

  return ACCEPTED_FORMATS.includes(metadata.format);
}
