import sharp from 'sharp';
import { expect, type Locator, type Page } from '@playwright/test';

export async function createPng(width: number, height: number) {
  const data = await sharp({
    create: { width, height, channels: 3, background: '#39f' },
  }).png().toBuffer();

  return [...data];
}

/** A photo-like JPEG, which the browser shrinks before uploading. */
export async function createJpeg(width: number, height: number) {
  const data = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: '#39f',
      noise: { type: 'gaussian', mean: 128, sigma: 30 },
    },
  }).jpeg({ quality: 95 }).toBuffer();

  return [...data];
}

/** Hands the editor a file the way the clipboard or a drop would. */
export async function sendImage(
  target: Locator,
  eventType: 'paste' | 'drop',
  bytes: number[],
  type = 'image/png',
) {
  // Base64 crosses into the page far faster than an array of numbers.
  const base64 = Buffer.from(bytes).toString('base64');

  await target.evaluate((element, { eventType, base64, type }) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(
      [Uint8Array.from(atob(base64), char => char.charCodeAt(0))],
      'image',
      { type },
    ));

    const rect = element.getBoundingClientRect();
    const event = eventType === 'paste'
      ? new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true,
        })
      : new DragEvent('drop', {
          dataTransfer,
          clientX: rect.left + 4,
          clientY: rect.top + rect.height / 2,
          bubbles: true,
          cancelable: true,
        });

    element.dispatchEvent(event);
  }, { eventType, base64, type });
}

export function images(page: Page) {
  return page.locator('[contenteditable] img');
}

export async function expectLoaded(image: Locator) {
  await expect.poll(
    () => image.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
}
