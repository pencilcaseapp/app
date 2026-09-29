import { expect, test } from '../fixtures/test';
import {
  createJpeg,
  createPng,
  expectLoaded,
  images,
  sendImage,
} from '../utils/images';

/**
 * The remote cursor of a collaborator, drawn into the container Lexical
 * portals next to the editor.
 */
const REMOTE_CURSOR = '.editor-collab-cursor';

test.describe('documents', () => {
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
      await expect(userA.documentInAllDocs(other))
        .toBeVisible({ timeout: 3000 });
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
});

test.describe('images', () => {
  test('a pasted image is stored and stays across a reload', async ({
    userA,
  }) => {
    await userA.createDocument();
    await userA.typeLines(`Image doc ${Date.now()}`, 'Above the image.');

    await sendImage(userA.editor, 'paste', await createPng(800, 400));

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

  test('an image pasted into another document is copied into it', async ({
    userA,
  }) => {
    const { page, editor } = userA;
    await userA.createDocument();
    await userA.typeLines(`Copy source ${Date.now()}`, 'Above the image.');
    await sendImage(editor, 'paste', await createPng(300, 200));
    await expectLoaded(images(page));
    const sourceSrc = await images(page).getAttribute('src');

    await images(page).click();
    await page.keyboard.press('ControlOrMeta+C');

    const urlB = await userA.createDocument();
    await userA.typeLines(`Copy target ${Date.now()}`, '');
    await page.keyboard.press('ControlOrMeta+V');

    // Lexical keeps a caret helper <img> next to an image at the end of the
    // document, which has no src.
    const pasted = page.locator('[contenteditable] img[src]');
    const documentIdB = new URL(urlB).pathname.split('/').pop();
    await expect(pasted).toHaveCount(1);
    await expect(pasted)
      .toHaveAttribute('src', new RegExp(`^/doc/${documentIdB}/assets/`));
    expect(await pasted.getAttribute('src')).not.toBe(sourceSrc);
    await expectLoaded(pasted);
  });

  test('a large photo is shrunk before it is uploaded', async ({ userA }) => {
    await userA.createDocument();
    await userA.typeLines(`Large image doc ${Date.now()}`, 'A photo.');
    const jpeg = await createJpeg(2400, 1200);

    // The body of a multipart upload is out of Playwright's reach.
    await userA.page.evaluate(() => {
      const { fetch } = window;
      window.fetch = (input, init) => {
        const file = init?.body instanceof FormData && init.body.get('file');
        document.body.dataset.uploadSize = String(file && (file as File).size);
        return fetch(input, init);
      };
    });
    await sendImage(userA.editor, 'paste', jpeg, 'image/jpeg');

    await expect(images(userA.page)).toHaveCount(1);
    const uploadSize = await userA.page.locator('body')
      .getAttribute('data-upload-size');
    expect(Number(uploadSize)).toBeLessThan(jpeg.length / 2);
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
  });

  test('a dragged image moves between the blocks', async ({ userA }) => {
    const { page, editor } = userA;
    await userA.createDocument();
    await userA.typeLines(`Drag doc ${Date.now()}`, 'First', 'Second');
    await editor.getByText('First').click();
    await sendImage(editor, 'paste', await createPng(300, 200));
    await expectLoaded(images(page));

    const image = (await images(page).boundingBox())!;
    const second = (await editor.getByText('Second').boundingBox())!;
    await page.mouse.move(image.x + 10, image.y + 10);
    await page.mouse.down();
    await page.mouse.move(image.x + 20, image.y + 20, { steps: 5 });
    await page.mouse.move(second.x + 10, second.y + second.height, {
      steps: 5,
    });
    await page.mouse.up();

    await expect(editor.locator('> *').nth(3).locator('img')).toBeVisible();
    await expect(editor.locator('> *').nth(2)).toHaveText('Second');
  });
});

test.describe('collaboration', () => {
  test('keeps a collaborator on an empty line out of the corner',
    async ({ userA, userB }) => {
      const url = await userA.createDocument();
      await userA.typeLines('Cursor', 'A line with words on it');
      await userA.shareDocument();
      await userB.openDocument(url);

      // A new, still empty line: the browser has nothing to measure there.
      await userA.editor.getByText('A line with words on it').click();
      await userA.page.keyboard.press('End');
      await userA.page.keyboard.press('Enter');

      const cursor = userB.page.locator(REMOTE_CURSOR).first();
      await expect(cursor).toBeVisible();

      const line = await userB.page
        .getByText('A line with words on it')
        .boundingBox();
      const box = await cursor.boundingBox();

      expect(line).not.toBeNull();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThan(line!.x - 1);
      expect(box!.y).toBeGreaterThan(line!.y);
    });
});

test.describe('sharing', () => {
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

  test('an image is only served to people who may open the document', async ({
    userA,
    userB,
  }) => {
    await userA.createDocument();
    await userA.typeLines(`Private image ${Date.now()}`);
    await sendImage(userA.editor, 'paste', await createPng(50, 50));

    const src = await images(userA.page).getAttribute('src');
    expect(src).toMatch(/^\/doc\/[0-9a-f-]+\/assets\//);

    const denied = await userB.page.request.get(src!);
    expect(denied.status()).toBe(404);

    const shareUrl = await userA.shareDocument();
    await userB.openDocument(shareUrl);
    await expectLoaded(images(userB.page));

    await userA.unshareDocument();
    const revoked = await userB.page.request.get(src!);
    expect(revoked.status()).toBe(404);
  });
});

test.describe('deletion', () => {
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
    await expect(userB.content).toContainText(heading);

    // The collaborator has no way to delete it.
    await userB.documentInAllDocs(heading).hover();
    await expect(userB.documentMenuTrigger('All Docs', heading)).toHaveCount(0);

    await userA.deleteDocument(heading);

    // User B is disconnected and the document is gone for them.
    await expect(userB.content).toBeHidden({ timeout: 10_000 });
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

  test('edits after a restore are persisted', async ({ userA }) => {
    await userA.createDocument();
    const heading = `Restored doc ${Date.now()}`;
    await userA.typeLines(heading);

    await userA.deleteDocument(heading);
    await expect(userA.deletedNotice).toBeVisible();
    await userA.restoreDocument(heading);
    await expect(userA.deletedNotice).toBeHidden();

    await userA.appendLinesAfter(heading, 'Written after the restore.');

    await expect(async () => {
      await userA.page.reload();
      await expect(userA.editor)
        .toContainText('Written after the restore.', { timeout: 3000 });
    }).toPass({ timeout: 15_000 });
  });
});
