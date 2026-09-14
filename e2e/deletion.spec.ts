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
