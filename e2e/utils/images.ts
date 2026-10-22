import sharp from 'sharp';
import { expect, type Locator, type Page } from '@playwright/test';

export async function createPng(width: number, height: number) {
  const data = await sharp({
    create: { width, height, channels: 3, background: '#39f' },
  }).png().toBuffer();

  return [...data];
}

/** Hands the editor a file the way the clipboard would. */
export async function pasteImage(target: Locator, bytes: number[]) {
  // Base64 crosses into the page far faster than an array of numbers.
  const base64 = Buffer.from(bytes).toString('base64');

  await target.evaluate((element, base64) => {
    const clipboardData = new DataTransfer();
    clipboardData.items.add(new File(
      [Uint8Array.from(atob(base64), char => char.charCodeAt(0))],
      'image',
      { type: 'image/png' },
    ));

    element.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData,
      bubbles: true,
      cancelable: true,
    }));
  }, base64);
}

export function images(page: Page) {
  return page.locator('[data-lexical-editor] img');
}

export async function expectLoaded(image: Locator) {
  await expect.poll(
    () => image.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
}
