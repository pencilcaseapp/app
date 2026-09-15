import { expect, test } from './fixtures';

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
