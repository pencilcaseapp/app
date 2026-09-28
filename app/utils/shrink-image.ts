import { MAX_IMAGE_WIDTH } from '~/constants/asset';

const SHRUNK_QUALITY = 0.9;

/**
 * Scales a photo down to the width the server stores before it is uploaded,
 * so a phone photo travels as a fraction of its size. The server still
 * processes whatever arrives, so this only saves time: anything it cannot
 * shrink (an animated GIF, a type the browser cannot decode or encode, an
 * image already narrow enough) goes up as it is.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (file.type === 'image/gif') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);

    if (bitmap.width <= MAX_IMAGE_WIDTH) {
      bitmap.close();
      return file;
    }

    const width = MAX_IMAGE_WIDTH;
    const height = Math.round(bitmap.height * width / bitmap.width);
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await encode(canvas, file.type);

    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], file.name, { type: blob.type });
  }
  catch {
    return file;
  }
}

/*
 * Safari cannot encode WebP and hands back a PNG instead, which is often
 * larger than the photo. A JPEG has no transparency to lose, so it can
 * fall back to JPEG; anything else is left to the server.
 */
async function encode(canvas: OffscreenCanvas, sourceType: string) {
  const types = sourceType === 'image/jpeg'
    ? ['image/webp', 'image/jpeg']
    : ['image/webp'];

  for (const type of types) {
    const blob = await canvas.convertToBlob({ type, quality: SHRUNK_QUALITY });

    if (blob.type === type) {
      return blob;
    }
  }

  return undefined;
}
