import { expect, test } from './fixtures';
import { createPng, expectLoaded, images, sendImage } from './utils';

test('a dropped image lands in the document', async ({ userA }) => {
  await userA.createDocument();
  await userA.typeLines(`Drop doc ${Date.now()}`, 'Drop below me.');

  await sendImage(
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
  await sendImage(userA.editor, 'paste', await createPng(50, 50));

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
