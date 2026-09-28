import sharp from 'sharp';
import { expect, type Locator, type Page } from '@playwright/test';

export async function createPng(width: number, height: number) {
  const data = await sharp({
    create: { width, height, channels: 3, background: '#39f' },
  }).png().toBuffer();

  return [...data];
}

/** Hands the editor a file the way the clipboard or a drop would. */
export async function sendImage(
  target: Locator,
  eventType: 'paste' | 'drop',
  bytes: number[],
) {
  await target.evaluate((element, { eventType, bytes }) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(
      [new Uint8Array(bytes)],
      'image.png',
      { type: 'image/png' },
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
  }, { eventType, bytes });
}

export function images(page: Page) {
  return page.locator('[contenteditable] img');
}

export async function expectLoaded(image: Locator) {
  await expect.poll(
    () => image.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
}
