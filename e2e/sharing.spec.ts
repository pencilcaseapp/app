import { expect, test } from './fixtures';

test('edits from an invited user reach the owner live', async ({
  userA,
  userB,
}) => {
  await userA.createDocument();
  await userA.typeLines(`Shared doc ${Date.now()}`, 'Written by User A.');

  const shareUrl = await userA.shareDocument();
  await userA.setLinkAccess('Can edit');

  await userB.openDocument(shareUrl);
  await expect(userB.editor).toContainText('Written by User A.');

  await userB.appendLinesAfter('Written by User A.', 'Written by User B.');

  await expect(userA.editor)
    .toContainText('Written by User B.', { timeout: 10_000 });
});

test('an invited user sees the shared document under All Docs', async ({
  userA,
  userB,
}) => {
  await userA.createDocument();

  const heading = `Doc from User A ${Date.now()}`;
  await userA.typeLines(heading);

  const shareUrl = await userA.shareDocument();

  await userB.openDocument(shareUrl);
  await expect(userB.content).toContainText(heading);

  await expect(userB.documentInAllDocs(heading)).toBeVisible();
});

test('the navigation marks a document shared through the link', async ({
  userA,
}) => {
  await userA.createDocument();

  const heading = `Marked doc ${Date.now()}`;
  await userA.typeLines(heading);

  const row = userA.documentInAllDocs(heading);
  await expect(row).toHaveAccessibleName(heading);

  await userA.shareDocument();
  await expect(row).toHaveAccessibleName(/Shared publicly/);

  await userA.unshareDocument();
  await expect(row).toHaveAccessibleName(heading);
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
  await expect(userB.content).toContainText(heading);

  await userA.unshareDocument();

  // No reload: the live server closes User B's connection and the client
  // revalidates into the permission denied screen.
  await expect(
    userB.page.getByRole('heading', { name: 'Permission Denied' }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(userB.content).toBeHidden();
});

test('a link that only allows viewing opens read-only', async ({
  userA,
  userB,
}) => {
  await userA.createDocument();

  const heading = `Read-only doc ${Date.now()}`;
  await userA.typeLines(heading);

  const shareUrl = await userA.shareDocument();

  await userB.openDocument(shareUrl);
  await expect(userB.content).toContainText(heading);
  await expect(userB.editor).toBeHidden();
});

test('granting editing reaches the other user immediately', async ({
  userA,
  userB,
}) => {
  await userA.createDocument();

  const heading = `Upgraded doc ${Date.now()}`;
  await userA.typeLines(heading);

  const shareUrl = await userA.shareDocument();

  await userB.openDocument(shareUrl);
  await expect(userB.editor).toBeHidden();

  await userA.setLinkAccess('Can edit');

  // No reload: the live server closes User B's connection and the client
  // revalidates into an editor that may write.
  await expect(userB.editor).toBeVisible({ timeout: 10_000 });

  await userB.appendLinesAfter(heading, 'Written by User B.');
  await expect(userA.editor)
    .toContainText('Written by User B.', { timeout: 10_000 });
});

test('a free account is offered the upgrade over inviting', async ({
  userA,
}) => {
  const documentUrl = await userA.createDocument();
  await userA.openSharePanel();

  await userA.page
    .getByRole('link', { name: /Invite people by email/ })
    .click();

  await expect(userA.page).toHaveURL(`${documentUrl}/settings/subscription`);
  // The panel gives way to the settings dialog it opens.
  await expect(
    userA.page.getByRole('switch', { name: 'Anyone with the link' }),
  ).toBeHidden();
});
