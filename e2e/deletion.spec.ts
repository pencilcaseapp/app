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

  // The open document was the deleted one, so the editor moved on.
  await expect(userA.page).not.toHaveURL(url);
  await userA.page.goto(url);
  await expect(
    userA.page.getByRole('heading', { name: 'Not Found' }),
  ).toBeVisible();

  await userA.restoreDocument(heading);

  await expect(userA.documentInDeleted(heading)).toBeHidden();
  await expect(userA.documentInAllDocs(heading)).toBeVisible();
  await userA.documentInAllDocs(heading).click();
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
