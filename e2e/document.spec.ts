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
