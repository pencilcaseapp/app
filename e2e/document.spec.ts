import { expect, test, type Page } from '@playwright/test';

function editor(page: Page) {
  return page.locator('[contenteditable="true"]');
}

test('a new document keeps its content across a reload', async ({ page }) => {
  await page.goto('/new');
  await page.waitForURL('**/doc/**');

  const heading = `My e2e document ${Date.now()}`;
  await editor(page).click();
  await page.keyboard.type(heading);
  await page.keyboard.press('Enter');
  await page.keyboard.type('Hello from Playwright.');

  await expect(editor(page)).toContainText(heading);
  await expect(editor(page)).toContainText('Hello from Playwright.');

  // Typing reaches the live server over the websocket, so the very last
  // keystrokes can still be in flight on the first reload — reload again
  // rather than flake.
  await expect(async () => {
    await page.reload();
    await expect(editor(page))
      .toContainText('Hello from Playwright.', { timeout: 3000 });
  }).toPass();

  await expect(editor(page)).toContainText(heading);
});
