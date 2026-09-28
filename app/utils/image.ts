import sharp, { type Metadata } from 'sharp';
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

    const { data, info } = await sharp(input, { ...options, animated: true })
      .rotate()
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

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
