import { expect, test } from './fixtures';
import { createPng, expectLoaded, images, sendImage } from './utils';

test('a new document keeps its content across a reload', async ({ user }) => {
  await user.createDocument();

  const heading = `My e2e document ${Date.now()}`;
  await user.typeLines(heading, 'Hello from Playwright.');

  await expect(user.editor).toContainText(heading);

  // Typing reaches the live server over the websocket, so the very last
  // keystrokes can still be in flight on the first reload — reload again
  // rather than flake.
  await expect(async () => {
    await user.page.reload();
    await expect(user.editor)
      .toContainText('Hello from Playwright.', { timeout: 3000 });
  }).toPass();

  await expect(user.editor).toContainText(heading);
});

test('a new document appears in the navigation under All Docs', async ({
  userA,
}) => {
  await userA.createDocument();

  const heading = `Navigation doc ${Date.now()}`;
  await userA.typeLines(heading);

  await expect(userA.documentInAllDocs(heading)).toBeVisible();

  // Still there after a fresh load, now from the document list.
  await userA.page.reload();
  await expect(userA.documentInAllDocs(heading))
    .toBeVisible({ timeout: 10_000 });
});

test('a retitled document keeps its title in the navigation', async ({
  userA,
}) => {
  const urlA = await userA.createDocument();
  const heading = `Retitled doc ${Date.now()}`;
  await userA.typeLines(heading);
  await userA.createDocument();
  const other = `Other doc ${Date.now()}`;
  await userA.typeLines(other);

  // A full load lists the other document by its stored title, which the
  // live server writes behind its debounce — reload until it has.
  await expect(async () => {
    await userA.openDocument(urlA);
    await expect(userA.documentInAllDocs(other)).toBeVisible({ timeout: 3000 });
  }).toPass();
  await userA.editor.locator('h1').click();
  await userA.page.keyboard.press('End');
  await userA.page.keyboard.type(' renamed');
  await expect(userA.documentInAllDocs(`${heading} renamed`)).toBeVisible();

  // Switching right away re-runs the navigation loader before the live
  // server has stored the new title.
  await userA.documentInAllDocs(other).click();
  await expect(userA.page).not.toHaveURL(urlA);
  await expect(userA.editor).toContainText(other);

  await expect(userA.documentInAllDocs(`${heading} renamed`)).toBeVisible();
  await expect(userA.page.getByRole('link', { name: heading, exact: true }))
    .toHaveCount(0);
});

test('the whole navigation row opens the document, menu space and all', async ({
  userA,
}) => {
  const urlA = await userA.createDocument();
  const heading = `Row click doc ${Date.now()}`;
  await userA.typeLines(heading);
  const urlB = await userA.createDocument();
  await userA.typeLines(`Other doc ${Date.now()}`);

  // The list only carries the stored title, which the live server writes
  // behind its debounce — reload the other document until it has.
  const link = userA.documentInAllDocs(heading);
  await expect(async () => {
    await userA.openDocument(urlB);
    await expect(link).toBeVisible({ timeout: 3000 });
  }).toPass();

  // The strip between the title and the row's menu button: reserved for
  // the menu, but not the menu itself, and the row's own dead zone until
  // the link was stretched over it.
  const linkBox = (await link.boundingBox())!;
  const menuBox
    = (await userA.documentMenuTrigger('All Docs', heading).boundingBox())!;
  await userA.page.mouse.click(
    (linkBox.x + linkBox.width + menuBox.x) / 2,
    linkBox.y + linkBox.height / 2,
  );

  await expect(userA.page).toHaveURL(urlA);
  await expect(userA.editor).toContainText(heading);
});

test('a reloaded document comes back where the reader left off', async ({
  user,
}) => {
  await user.createDocument();
  await user.typeLines(
    `Scroll doc ${Date.now()}`,
    ...Array.from({ length: 45 }, (_, index) => `Line ${index + 1}`),
  );

  await user.page.evaluate(() => window.scrollTo({ top: 400 }));
  await expect
    .poll(() => user.page.evaluate(() => window.scrollY))
    .toBe(400);

  // The content only arrives over the websocket after the page has
  // loaded, so the scroll position is taken once the editor has it.
  await user.page.reload();
  await expect(user.editor).toContainText('Line 45');
  await expect
    .poll(() => user.page.evaluate(() => window.scrollY))
    .toBe(400);
});

test('a pasted image is stored and stays across a reload', async ({
  userA,
}) => {
  await userA.createDocument();
  await userA.typeLines(`Image doc ${Date.now()}`, 'Above the image.');

  await sendImage(userA.editor, 'paste', await createPng(800, 400));

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

test('a large image is shrunk before it is uploaded', async ({ userA }) => {
  await userA.createDocument();
  await userA.typeLines(`Large image doc ${Date.now()}`, 'A photo.');
  const png = await createPng(2400, 1200, { noise: true });

  // The body of a multipart upload is out of Playwright's reach.
  await userA.page.evaluate(() => {
    const { fetch } = window;
    window.fetch = (input, init) => {
      const file = init?.body instanceof FormData && init.body.get('file');
      document.body.dataset.uploadSize = String(file && (file as File).size);
      return fetch(input, init);
    };
  });
  await sendImage(userA.editor, 'paste', png);

  await expect(images(userA.page)).toHaveCount(1);
  const uploadSize = await userA.page.locator('body')
    .getAttribute('data-upload-size');
  expect(Number(uploadSize)).toBeLessThan(png.length / 2);
  await expect(images(userA.page)).toHaveAttribute('width', '1600');
  await expectLoaded(images(userA.page));
});

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

  const image = await images(userA.page).boundingBox();
  const column = await userA.editor
    .locator('p', { hasText: 'Drop below me.' }).boundingBox();
  const center = (box: typeof image) => box!.x + box!.width / 2;
  expect(Math.abs(center(image) - center(column))).toBeLessThan(2);
});
