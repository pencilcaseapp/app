import { afterEach, describe, expect, it, vi } from 'vitest';
import { shrinkImage } from './shrink-image';

const drawImage = vi.fn();
const convertToBlob = vi.fn<(options: ImageEncodeOptions) => Promise<Blob>>();

class FakeCanvas {
  constructor(public width: number, public height: number) {}
  getContext = () => ({ drawImage });
  convertToBlob = convertToBlob;
}

function stubBitmap(width: number, height: number) {
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({
    width,
    height,
    close: vi.fn(),
  })));
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
}

const photo = (type = 'image/jpeg', size = 1000) =>
  new File([new Uint8Array(size)], 'photo.jpg', { type });

afterEach(() => {
  vi.unstubAllGlobals();
  drawImage.mockReset();
  convertToBlob.mockReset();
});

describe('shrinkImage', () => {
  it('scales a wide image to the stored width as WebP', async () => {
    stubBitmap(4000, 3000);
    convertToBlob.mockImplementation(async ({ type }) =>
      new Blob([new Uint8Array(100)], { type }));

    const shrunk = await shrinkImage(photo());

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 1200);
    expect(shrunk.type).toBe('image/webp');
    expect(shrunk.size).toBe(100);
    expect(shrunk.name).toBe('photo.jpg');
  });

  it('falls back to JPEG for a photo when WebP cannot be encoded', async () => {
    stubBitmap(4000, 3000);
    convertToBlob.mockImplementation(async ({ type }) =>
      new Blob([new Uint8Array(100)], {
        type: type === 'image/webp' ? 'image/png' : type,
      }));

    expect((await shrinkImage(photo())).type).toBe('image/jpeg');
  });

  it('keeps a PNG as it is when WebP cannot be encoded', async () => {
    stubBitmap(4000, 3000);
    convertToBlob.mockResolvedValue(new Blob([], { type: 'image/png' }));
    const file = photo('image/png');

    expect(await shrinkImage(file)).toBe(file);
  });

  it('keeps an image that is narrow enough', async () => {
    stubBitmap(1600, 900);
    const file = photo();

    expect(await shrinkImage(file)).toBe(file);
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('keeps a GIF, which may be animated', async () => {
    stubBitmap(4000, 3000);
    const file = photo('image/gif');

    expect(await shrinkImage(file)).toBe(file);
  });

  it('keeps the original when shrinking does not make it smaller', async () => {
    stubBitmap(4000, 3000);
    convertToBlob.mockImplementation(async ({ type }) =>
      new Blob([new Uint8Array(2000)], { type }));
    const file = photo();

    expect(await shrinkImage(file)).toBe(file);
  });

  it('keeps an image the browser cannot decode', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => {
      throw new DOMException('undecodable', 'InvalidStateError');
    }));
    const file = photo('image/heic');

    expect(await shrinkImage(file)).toBe(file);
  });
});
