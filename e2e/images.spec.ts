import sharp from 'sharp';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function createPng(width: number, height: number) {
  const data = await sharp({
    create: { width, height, channels: 3, background: '#39f' },
  }).png().toBuffer();

  return [...data];
}

/** Hands the editor a file the way the clipboard or a drop would. */
async function sendImage(
  page: Page,
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

function images(page: Page) {
  return page.locator('[contenteditable] img');
}

async function expectLoaded(image: Locator) {
  await expect.poll(
    () => image.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
}

test('a pasted image is stored and stays across a reload', async ({
  userA,
}) => {
  await userA.createDocument();
  await userA.typeLines(`Image doc ${Date.now()}`, 'Above the image.');

  await sendImage(userA.page, userA.editor, 'paste', await createPng(800, 400));

  const image = images(userA.page);
  await expect(image).toHaveCount(1);
  await expect(image).toHaveAttribute('src', /^\/user-assets\//);
  await expect(image).toHaveAttribute('width', '800');
  await expectLoaded(image);

  await expect(async () => {
    await userA.page.reload();
    await expect(images(userA.page)).toHaveCount(1, { timeout: 3000 });
  }).toPass();
  await expectLoaded(images(userA.page));
});

test('a dropped image lands in the document', async ({ userA }) => {
  await userA.createDocument();
  await userA.typeLines(`Drop doc ${Date.now()}`, 'Drop below me.');

  await sendImage(
    userA.page,
    userA.editor.getByText('Drop below me.'),
    'drop',
    await createPng(300, 200),
  );

  await expect(images(userA.page)).toHaveCount(1);
  await expectLoaded(images(userA.page));
});

test('an image is only served to people who may open the document', async ({
  userA,
  userB,
}) => {
  await userA.createDocument();
  await userA.typeLines(`Private image ${Date.now()}`);
  await sendImage(userA.page, userA.editor, 'paste', await createPng(50, 50));

  const src = await images(userA.page).getAttribute('src');
  expect(src).toMatch(/^\/user-assets\//);

  const denied = await userB.page.request.get(src!);
  expect(denied.status()).toBe(404);

  const shareUrl = await userA.shareDocument();
  await userB.openDocument(shareUrl);
  await expectLoaded(images(userB.page));

  await userA.unshareDocument();
  const revoked = await userB.page.request.get(src!);
  expect(revoked.status()).toBe(404);
});
