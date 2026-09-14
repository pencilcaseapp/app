import { expect, test } from './fixtures';

test('a deleted document moves to Deleted and back on restore', async ({
  userA,
}) => {
  const url = await userA.createDocument();
  const heading = `Deleted doc ${Date.now()}`;
  await userA.typeLines(heading);
  await expect(userA.documentInAllDocs(heading)).toBeVisible();

  await userA.deleteDocument(heading);

  await expect(userA.documentInAllDocs(heading)).toBeHidden();
  // It was the only document, so All Docs shows its empty state.
  await expect(userA.page.getByText('No documents')).toBeVisible();
  await userA.openDeletedDocs();
  await expect(userA.documentInDeleted(heading)).toBeVisible();

  // The document stays open, now read-only with the notice on top.
  await expect(userA.page).toHaveURL(url);
  await expect(userA.deletedNotice).toBeVisible();
  await expect(userA.page.locator('[contenteditable="false"]'))
    .toContainText(heading);

  // It opens the same way from the Deleted group after a reload.
  await userA.page.reload();
  await expect(userA.deletedNotice).toBeVisible();
  await userA.openDeletedDocs();
  await userA.documentInDeleted(heading).click();
  await expect(userA.deletedNotice).toBeVisible();

  await userA.restoreDocument(heading);

  await expect(userA.documentInDeleted(heading)).toBeHidden();
  await expect(userA.documentInAllDocs(heading)).toBeVisible();
  await expect(userA.deletedNotice).toBeHidden();
  await expect(userA.editor).toContainText(heading);

  // Deleting the restored document again closes the dialog as before.
  await userA.deleteDocument(heading);
  await expect(userA.page.getByRole('dialog')).toBeHidden();
  await expect(userA.deletedNotice).toBeVisible();
});

test('deleting a shared document unshares it', async ({ userA, userB }) => {
  await userA.createDocument();
  const heading = `Shared then deleted ${Date.now()}`;
  await userA.typeLines(heading);
  const shareUrl = await userA.shareDocument();

  await userB.openDocument(shareUrl);
  await expect(userB.editor).toContainText(heading);

  // The collaborator has no way to delete it.
  await userB.documentInAllDocs(heading).hover();
  await expect(userB.documentMenuTrigger('All Docs', heading)).toHaveCount(0);

  await userA.deleteDocument(heading);

  // User B is disconnected and the document is gone for them.
  await expect(userB.editor).toBeHidden({ timeout: 10_000 });
  await expect(userB.documentInAllDocs(heading)).toBeHidden();
  await userB.page.goto(shareUrl);
  await expect(
    userB.page.getByRole('heading', { name: 'Not Found' }),
  ).toBeVisible();

  // Restoring brings it back private: still no access for User B.
  await userA.restoreDocument(heading);
  await userB.page.goto(shareUrl);
  await expect(
    userB.page.getByRole('heading', { name: 'Permission Denied' }),
  ).toBeVisible();
  await userB.openDeletedDocs();
  await expect(userB.documentInDeleted(heading)).toHaveCount(0);
});

test('deleting the open document scrolls up to the notice', async ({
  userA,
}) => {
  await userA.createDocument();
  const heading = `Long doc ${Date.now()}`;
  const lines = Array.from({ length: 60 }, (_, index) => `Line ${index}`);
  await userA.typeLines(heading, ...lines);

  await userA.page.evaluate(() =>
    window.scrollTo(0, document.body.scrollHeight),
  );
  expect(await userA.page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await userA.deleteDocument(heading);

  await expect(userA.deletedNotice).toBeInViewport();
  expect(await userA.page.evaluate(() => window.scrollY)).toBe(0);
});
