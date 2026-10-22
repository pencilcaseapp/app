import { expect, test } from '../fixtures/test';
import { createPng, expectLoaded, images, pasteImage } from '../utils/images';

test.describe('documents', () => {
  test('a new document keeps its content across a reload', async ({ user }) => {
    await user.document.create();

    const heading = `My e2e document ${Date.now()}`;
    await user.document.typeLines(heading, 'Hello from Playwright.');

    await expect(user.document.editor).toContainText(heading);
    await expect(user.sidebar.documentInAllDocs(heading)).toBeVisible();

    // Typing reaches the live server over the websocket, so the very last
    // keystrokes can still be in flight on the first reload — reload again
    // rather than flake.
    await expect(async () => {
      await user.page.reload();
      await expect(user.document.editor)
        .toContainText('Hello from Playwright.', { timeout: 3000 });
    }).toPass();

    await expect(user.document.editor).toContainText(heading);
    // Still listed after a fresh load, now from the document list.
    await expect(user.sidebar.documentInAllDocs(heading)).toBeVisible();
  });
});

test.describe('images', () => {
  test('a pasted image is stored and stays across a reload', async ({
    userA,
  }) => {
    await userA.document.create();
    await userA.document.typeLines(`Image doc ${Date.now()}`, 'Above the image.');

    await pasteImage(userA.document.editor, await createPng(800, 400));

    const image = images(userA.page);
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute('src', /^\/doc\/[0-9a-f-]+\/assets\//);
    await expect(image).toHaveAttribute('width', '800');
    await expectLoaded(image);

    await expect(async () => {
      await userA.page.reload();
      await expect(images(userA.page)).toHaveCount(1, { timeout: 3000 });
    }).toPass();
    await expectLoaded(images(userA.page));
  });
});

test.describe('sharing', () => {
  test('edits from an invited user reach the owner live', async ({
    userA,
    userB,
  }) => {
    await userA.document.create();
    const heading = `Shared doc ${Date.now()}`;
    await userA.document.typeLines(heading, 'Written by User A.');

    const shareUrl = await userA.sharePanel.share();
    await userA.sharePanel.setLinkAccess('Can edit');

    await userB.document.open(shareUrl);
    await expect(userB.document.editor).toContainText('Written by User A.');
    await expect(userB.sidebar.documentInAllDocs(heading)).toBeVisible();

    await userB.document.appendLinesAfter('Written by User A.', 'Written by User B.');

    await expect(userA.document.editor)
      .toContainText('Written by User B.', { timeout: 10_000 });
  });

  test('unsharing revokes the access of the other user immediately', async ({
    userA,
    userB,
  }) => {
    await userA.document.create();

    const heading = `Revoked doc ${Date.now()}`;
    await userA.document.typeLines(heading);

    const shareUrl = await userA.sharePanel.share();

    await userB.document.open(shareUrl);
    await expect(userB.document.content).toContainText(heading);

    await userA.sharePanel.unshare();

    // No reload: the live server closes User B's connection and the client
    // revalidates into the permission denied screen.
    await expect(
      userB.page.getByRole('heading', { name: 'Permission Denied' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(userB.document.content).toBeHidden();
  });

  test('granting editing reaches the other user immediately', async ({
    userA,
    userB,
  }) => {
    await userA.document.create();

    const heading = `Upgraded doc ${Date.now()}`;
    await userA.document.typeLines(heading);

    const shareUrl = await userA.sharePanel.share();

    // The link starts out only allowing viewing.
    await userB.document.open(shareUrl);
    await expect(userB.document.content).toContainText(heading);
    await expect(userB.document.editor).toBeHidden();

    await userA.sharePanel.setLinkAccess('Can edit');

    // No reload: the live server closes User B's connection and the client
    // revalidates into an editor that may write.
    await expect(userB.document.editor).toBeVisible({ timeout: 10_000 });

    await userB.document.appendLinesAfter(heading, 'Written by User B.');
    await expect(userA.document.editor)
      .toContainText('Written by User B.', { timeout: 10_000 });
  });

  test('an image is only served to people who may open the document', async ({
    userA,
    userB,
  }) => {
    await userA.document.create();
    await userA.document.typeLines(`Private image ${Date.now()}`);
    await pasteImage(userA.document.editor, await createPng(50, 50));

    const src = await images(userA.page).getAttribute('src');
    expect(src).toMatch(/^\/doc\/[0-9a-f-]+\/assets\//);

    const denied = await userB.page.request.get(src!);
    expect(denied.status()).toBe(404);

    const shareUrl = await userA.sharePanel.share();
    await userB.document.open(shareUrl);
    await expectLoaded(images(userB.page));

    await userA.sharePanel.unshare();
    const revoked = await userB.page.request.get(src!);
    expect(revoked.status()).toBe(404);
  });
});

test.describe('deletion', () => {
  test('a deleted document moves to Deleted and back on restore', async ({
    userA,
  }) => {
    const url = await userA.document.create();
    const heading = `Deleted doc ${Date.now()}`;
    await userA.document.typeLines(heading);
    await expect(userA.sidebar.documentInAllDocs(heading)).toBeVisible();

    await userA.sidebar.deleteDocument(heading);

    // It was the only document, so the start page opens a new one.
    await expect(userA.page).not.toHaveURL(url);
    await expect(userA.sidebar.documentInAllDocs(heading)).toBeHidden();
    await userA.sidebar.openDeletedDocs();
    await expect(userA.sidebar.documentInDeleted(heading)).toBeVisible();

    // It opens read-only from Deleted, with the notice on top.
    await userA.sidebar.documentInDeleted(heading).click();
    await expect(userA.page).toHaveURL(url);
    await expect(userA.document.deletedNotice).toBeVisible();
    await expect(userA.document.content).toHaveAttribute('contenteditable', 'false');
    await expect(userA.document.content).toContainText(heading);

    // It stays that way after a reload.
    await userA.page.reload();
    await expect(userA.document.deletedNotice).toBeVisible();

    await userA.sidebar.restoreDocument(heading);

    await expect(userA.sidebar.documentInDeleted(heading)).toBeHidden();
    await expect(userA.sidebar.documentInAllDocs(heading)).toBeVisible();
    await expect(userA.document.deletedNotice).toBeHidden();
    await expect(userA.document.editor).toContainText(heading);

    // Edits after the restore are stored again.
    await userA.document.appendLinesAfter(heading, 'Written after the restore.');
    await expect(async () => {
      await userA.page.reload();
      await expect(userA.document.editor)
        .toContainText('Written after the restore.', { timeout: 3000 });
    }).toPass({ timeout: 15_000 });
  });

  test('deleting a shared document unshares it', async ({ userA, userB }) => {
    await userA.document.create();
    const heading = `Shared then deleted ${Date.now()}`;
    await userA.document.typeLines(heading);
    const shareUrl = await userA.sharePanel.share();

    await userB.document.open(shareUrl);
    await expect(userB.document.content).toContainText(heading);

    await userA.sidebar.deleteDocument(heading);

    // User B is disconnected and the document is gone for them.
    await expect(userB.document.content).toBeHidden({ timeout: 10_000 });
    await expect(userB.sidebar.documentInAllDocs(heading)).toBeHidden();
    await userB.page.goto(shareUrl);
    await expect(
      userB.page.getByRole('heading', { name: 'Not Found' }),
    ).toBeVisible();

    // Restoring brings it back private: still no access for User B.
    await userA.sidebar.restoreDocument(heading);
    await userB.page.goto(shareUrl);
    await expect(
      userB.page.getByRole('heading', { name: 'Permission Denied' }),
    ).toBeVisible();
    await userB.sidebar.openDeletedDocs();
    await expect(userB.sidebar.documentInDeleted(heading)).toHaveCount(0);
  });
});
