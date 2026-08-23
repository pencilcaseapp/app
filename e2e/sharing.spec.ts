import { expect, test } from './fixtures';

test('edits from an invited user reach the owner live', async ({
  userA,
  userB,
}) => {
  await userA.createDocument();
  await userA.typeLines(`Shared doc ${Date.now()}`, 'Written by User A.');

  const shareUrl = await userA.shareDocument();

  await userB.openDocument(shareUrl);
  await expect(userB.editor).toContainText('Written by User A.');

  await userB.appendLinesAfter('Written by User A.', 'Written by User B.');

  await expect(userA.editor)
    .toContainText('Written by User B.', { timeout: 10_000 });
});

test('a shared document appears in the navigation of the user it was shared '
  + 'with', async ({ userA, userB }) => {
  await userA.createDocument();

  const heading = `Doc from User A ${Date.now()}`;
  await userA.typeLines(heading);

  const shareUrl = await userA.shareDocument();

  await userB.openDocument(shareUrl);
  await expect(userB.editor).toContainText(heading);

  await expect(userB.documentInAllDocs(heading)).toBeVisible();
});

test('unsharing revokes the access of the other user immediately', async ({
  userA,
  userB,
}) => {
  await userA.createDocument();

  const heading = `Revoked doc ${Date.now()}`;
  await userA.typeLines(heading);

  const shareUrl = await userA.shareDocument();

  await userB.openDocument(shareUrl);
  await expect(userB.editor).toContainText(heading);

  await userA.unshareDocument();

  // No reload: the live server closes User B's connection and the client
  // revalidates into the permission denied screen.
  await expect(
    userB.page.getByRole('heading', { name: 'Permission Denied' }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(userB.editor).toBeHidden();
});
