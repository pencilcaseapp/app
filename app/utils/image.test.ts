import { describe, expect, it } from 'vitest';
import sharp, { type Sharp } from 'sharp';
import { processImage } from './image';

function createImage(width: number, height: number, background = '#39f') {
  return sharp({ create: { width, height, channels: 3, background } });
}

async function toBytes(image: Sharp) {
  return new Uint8Array(await image.toBuffer());
}

describe('processImage', () => {
  it('stores a JPEG as WebP at its own size', async () => {
    const input = await toBytes(createImage(400, 300).jpeg());

    const image = await processImage(input);

    expect(image).toMatchObject({ width: 400, height: 300 });
    expect((await sharp(image!.data).metadata()).format).toBe('webp');
  });

  it('scales a wide image down to 1600 pixels', async () => {
    const input = await toBytes(createImage(3200, 1000).png());

    const image = await processImage(input);

    expect(image).toMatchObject({ width: 1600, height: 500 });
  });

  it('keeps a screenshot lossless', async () => {
    const input = await toBytes(createImage(400, 300).composite([{
      input: Buffer.from('<svg width="400" height="300"><text x="10" '
        + 'y="40" font-size="24">Sharp text</text></svg>'),
    }]).png());

    const image = await processImage(input);
    const [stored, original] = await Promise.all([
      sharp(image!.data).removeAlpha().raw().toBuffer(),
      sharp(input).removeAlpha().raw().toBuffer(),
    ]);

    expect(stored.equals(original)).toBe(true);
  });

  it('encodes a PNG photo lossy when lossless would be too big', async () => {
    const input = await toBytes(sharp({
      create: {
        width: 1600,
        height: 1200,
        channels: 3,
        background: '#39f',
        noise: { type: 'gaussian', mean: 128, sigma: 40 },
      },
    }).png());

    const image = await processImage(input);
    const [stored, original] = await Promise.all([
      sharp(image!.data).raw().toBuffer(),
      sharp(input).raw().toBuffer(),
    ]);

    expect(stored.equals(original)).toBe(false);
  });

  it('turns a photo upright and drops its metadata', async () => {
    const input = await toBytes(createImage(300, 200).jpeg().withMetadata({
      orientation: 6,
      exif: { IFD0: { Make: 'Phone' } },
    }));

    const image = await processImage(input);
    const metadata = await sharp(image!.data).metadata();

    expect(image).toMatchObject({ width: 200, height: 300 });
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
  });

  it('keeps an animated GIF animated', async () => {
    const frames = await Promise.all(['#39f', '#f93'].map(
      colour => createImage(30, 40, colour).png().toBuffer(),
    ));
    const input = await toBytes(
      sharp(frames, { join: { animated: true } }).gif(),
    );

    const image = await processImage(input);
    const metadata = await sharp(image!.data).metadata();

    expect(image).toMatchObject({ width: 30, height: 40 });
    expect(metadata.pages).toBe(2);
  });

  it('accepts WebP and AVIF', async () => {
    const webp = await toBytes(createImage(20, 10).webp());
    const avif = await toBytes(createImage(20, 10).avif());

    expect(await processImage(webp)).toMatchObject({ width: 20 });
    expect(await processImage(avif)).toMatchObject({ width: 20 });
  });

  it('refuses an image with too many pixels', async () => {
    const input = await toBytes(createImage(10_000, 6_000).png());

    expect(await processImage(input)).toBeUndefined();
  });

  it('refuses SVG', async () => {
    const input = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
      + '<script>alert(1)</script></svg>',
    );

    expect(await processImage(input)).toBeUndefined();
  });

  it('refuses what is not an image', async () => {
    const input = new TextEncoder().encode('%PDF-1.7 not an image');

    expect(await processImage(input)).toBeUndefined();
  });
});
