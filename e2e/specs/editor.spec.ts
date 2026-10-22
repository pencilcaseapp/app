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
    await user.document.create();

    const heading = `My e2e document ${Date.now()}`;
    await user.document.typeLines(heading, 'Hello from Playwright.');

    await expect(user.document.editor).toContainText(heading);

    // Typing reaches the live server over the websocket, so the very last
    // keystrokes can still be in flight on the first reload — reload again
    // rather than flake.
    await expect(async () => {
      await user.page.reload();
      await expect(user.document.editor)
        .toContainText('Hello from Playwright.', { timeout: 3000 });
    }).toPass();

    await expect(user.document.editor).toContainText(heading);
  });

  test('a stored document is on the page before the scripts run', async ({
    userA,
    browser,
    baseURL,
  }) => {
    const url = await userA.document.create();
    const heading = `Server drawn ${Date.now()}`;
    await userA.document.typeLines(heading, 'Drawn before the websocket connects.');

    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      storageState: await userA.page.context().storageState(),
    });
    const page = await context.newPage();

    // The server draws what was last stored, which trails the typing by
    // the live server's store debounce.
    await expect(async () => {
      await page.goto(url);
      await expect(page.locator('h1')).toHaveText(heading, { timeout: 1000 });
    }).toPass();
    await expect(page.getByText('Drawn before the websocket connects.'))
      .toBeVisible();

    await context.close();
  });

  test('a new document appears in the navigation under All Docs', async ({
    userA,
  }) => {
    await userA.document.create();

    const heading = `Navigation doc ${Date.now()}`;
    await userA.document.typeLines(heading);

    await expect(userA.sidebar.documentInAllDocs(heading)).toBeVisible();

    // Still there after a fresh load, now from the document list.
    await userA.page.reload();
    await expect(userA.sidebar.documentInAllDocs(heading))
      .toBeVisible({ timeout: 10_000 });
  });

  test('a retitled document keeps its title in the navigation', async ({
    userA,
  }) => {
    const urlA = await userA.document.create();
    const heading = `Retitled doc ${Date.now()}`;
    await userA.document.typeLines(heading);
    await userA.document.create();
    const other = `Other doc ${Date.now()}`;
    await userA.document.typeLines(other);

    // A full load lists the other document by its stored title, which the
    // live server writes behind its debounce — reload until it has.
    await expect(async () => {
      await userA.document.open(urlA);
      await expect(userA.sidebar.documentInAllDocs(other))
        .toBeVisible({ timeout: 3000 });
    }).toPass();
    await userA.document.editor.locator('h1').click();
    await userA.page.keyboard.press('End');
    await userA.page.keyboard.type(' renamed');
    await expect(userA.sidebar.documentInAllDocs(`${heading} renamed`)).toBeVisible();

    // Switching right away re-runs the navigation loader before the live
    // server has stored the new title.
    await userA.sidebar.documentInAllDocs(other).click();
    await expect(userA.page).not.toHaveURL(urlA);
    await expect(userA.document.editor).toContainText(other);

    await expect(userA.sidebar.documentInAllDocs(`${heading} renamed`)).toBeVisible();
    await expect(userA.page.getByRole('link', { name: heading, exact: true }))
      .toHaveCount(0);
  });

  test('the whole navigation row opens the document, menu space and all', async ({
    userA,
  }) => {
    const urlA = await userA.document.create();
    const heading = `Row click doc ${Date.now()}`;
    await userA.document.typeLines(heading);
    const urlB = await userA.document.create();
    await userA.document.typeLines(`Other doc ${Date.now()}`);

    // The list only carries the stored title, which the live server writes
    // behind its debounce — reload the other document until it has.
    const link = userA.sidebar.documentInAllDocs(heading);
    await expect(async () => {
      await userA.document.open(urlB);
      await expect(link).toBeVisible({ timeout: 3000 });
    }).toPass();

    // The strip between the title and the row's menu button: reserved for
    // the menu, but not the menu itself, and the row's own dead zone until
    // the link was stretched over it.
    const linkBox = (await link.boundingBox())!;
    const menuBox
      = (await userA.sidebar.documentMenuTrigger('All Docs', heading).boundingBox())!;
    await userA.page.mouse.click(
      (linkBox.x + linkBox.width + menuBox.x) / 2,
      linkBox.y + linkBox.height / 2,
    );

    await expect(userA.page).toHaveURL(urlA);
    await expect(userA.document.editor).toContainText(heading);
  });

  test('a reloaded document comes back where the reader left off', async ({
    user,
  }) => {
    const url = await user.document.create();
    await user.document.typeLines(
      `Scroll doc ${Date.now()}`,
      ...Array.from({ length: 45 }, (_, index) => `Line ${index + 1}`),
    );

    await user.page.evaluate(() => window.scrollTo({ top: 400 }));
    await expect
      .poll(() => user.page.evaluate(() => window.scrollY))
      .toBe(400);

    // The page is drawn from what was last stored, so the content has to
    // be stored before the reload for the page to be that tall.
    await expect
      .poll(async () => (await user.page.request.get(url)).text())
      .toContain('Line 45');
    await user.page.reload();
    await expect(user.document.editor).toContainText('Line 45');
    await expect
      .poll(() => user.page.evaluate(() => window.scrollY))
      .toBe(400);
  });
});

test.describe('images', () => {
  test('a pasted image is stored and stays across a reload', async ({
    userA,
  }) => {
    await userA.document.create();
    await userA.document.typeLines(`Image doc ${Date.now()}`, 'Above the image.');

    await sendImage(userA.document.editor, 'paste', await createPng(800, 400));

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
    const { page } = userA;
    const { editor } = userA.document;
    await userA.document.create();
    await userA.document.typeLines(`Copy source ${Date.now()}`, 'Above the image.');
    await sendImage(editor, 'paste', await createPng(300, 200));
    await expectLoaded(images(page));
    const sourceSrc = await images(page).getAttribute('src');

    await images(page).click();
    await page.keyboard.press('ControlOrMeta+C');

    const urlB = await userA.document.create();
    await userA.document.typeLines(`Copy target ${Date.now()}`, '');
    await page.keyboard.press('ControlOrMeta+V');

    // Lexical keeps a caret helper <img> next to an image at the end of the
    // document, which has no src.
    const pasted = page.locator('[data-lexical-editor] img[src]');
    const documentIdB = new URL(urlB).pathname.split('/').pop();
    await expect(pasted).toHaveCount(1);
    await expect(pasted)
      .toHaveAttribute('src', new RegExp(`^/doc/${documentIdB}/assets/`));
    expect(await pasted.getAttribute('src')).not.toBe(sourceSrc);
    await expectLoaded(pasted);
  });

  test('a large photo is shrunk before it is uploaded', async ({ userA }) => {
    await userA.document.create();
    await userA.document.typeLines(`Large image doc ${Date.now()}`, 'A photo.');
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
    await sendImage(userA.document.editor, 'paste', jpeg, 'image/jpeg');

    await expect(images(userA.page)).toHaveCount(1);
    const uploadSize = await userA.page.locator('body')
      .getAttribute('data-upload-size');
    expect(Number(uploadSize)).toBeLessThan(jpeg.length / 2);
    await expect(images(userA.page)).toHaveAttribute('width', '1600');
    await expectLoaded(images(userA.page));
  });

  test('a dropped image lands in the document', async ({ userA }) => {
    await userA.document.create();
    await userA.document.typeLines(`Drop doc ${Date.now()}`, 'Drop below me.');

    await sendImage(
      userA.document.editor.getByText('Drop below me.'),
      'drop',
      await createPng(300, 200),
    );

    await expect(images(userA.page)).toHaveCount(1);
    await expectLoaded(images(userA.page));
  });

  test('a dragged image moves between the blocks', async ({ userA }) => {
    const { page } = userA;
    const { editor } = userA.document;
    await userA.document.create();
    await userA.document.typeLines(`Drag doc ${Date.now()}`, 'First', 'Second');
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
      const url = await userA.document.create();
      await userA.document.typeLines('Cursor', 'A line with words on it');
      await userA.sharePanel.share();
      await userB.document.open(url);

      // A new, still empty line: the browser has nothing to measure there.
      await userA.document.editor.getByText('A line with words on it').click();
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
    await userA.document.create();
    await userA.document.typeLines(`Shared doc ${Date.now()}`, 'Written by User A.');

    const shareUrl = await userA.sharePanel.share();
    await userA.sharePanel.setLinkAccess('Can edit');

    await userB.document.open(shareUrl);
    await expect(userB.document.editor).toContainText('Written by User A.');

    await userB.document.appendLinesAfter('Written by User A.', 'Written by User B.');

    await expect(userA.document.editor)
      .toContainText('Written by User B.', { timeout: 10_000 });
  });

  test('an invited user sees the shared document under All Docs', async ({
    userA,
    userB,
  }) => {
    await userA.document.create();

    const heading = `Doc from User A ${Date.now()}`;
    await userA.document.typeLines(heading);

    const shareUrl = await userA.sharePanel.share();

    await userB.document.open(shareUrl);
    await expect(userB.document.content).toContainText(heading);

    await expect(userB.sidebar.documentInAllDocs(heading)).toBeVisible();
  });

  test('the navigation marks a document shared through the link', async ({
    userA,
  }) => {
    await userA.document.create();

    const heading = `Marked doc ${Date.now()}`;
    await userA.document.typeLines(heading);

    const row = userA.sidebar.documentInAllDocs(heading);
    await expect(row).toHaveAccessibleName(heading);

    await userA.sharePanel.share();
    await expect(row).toHaveAccessibleName(/Shared publicly/);

    await userA.sharePanel.unshare();
    await expect(row).toHaveAccessibleName(heading);
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

  test('a link that only allows viewing opens read-only', async ({
    userA,
    userB,
  }) => {
    await userA.document.create();

    const heading = `Read-only doc ${Date.now()}`;
    await userA.document.typeLines(heading);

    const shareUrl = await userA.sharePanel.share();

    await userB.document.open(shareUrl);
    await expect(userB.document.content).toContainText(heading);
    await expect(userB.document.editor).toBeHidden();
  });

  test('granting editing reaches the other user immediately', async ({
    userA,
    userB,
  }) => {
    await userA.document.create();

    const heading = `Upgraded doc ${Date.now()}`;
    await userA.document.typeLines(heading);

    const shareUrl = await userA.sharePanel.share();

    await userB.document.open(shareUrl);
    await expect(userB.document.editor).toBeHidden();

    await userA.sharePanel.setLinkAccess('Can edit');

    // No reload: the live server closes User B's connection and the client
    // revalidates into an editor that may write.
    await expect(userB.document.editor).toBeVisible({ timeout: 10_000 });

    await userB.document.appendLinesAfter(heading, 'Written by User B.');
    await expect(userA.document.editor)
      .toContainText('Written by User B.', { timeout: 10_000 });
  });

  test('a free account is offered the upgrade over inviting', async ({
    userA,
  }) => {
    const documentUrl = await userA.document.create();
    await userA.sharePanel.open();

    await userA.page
      .getByRole('link', { name: /Invite people by email/ })
      .click();

    await expect(userA.page).toHaveURL(`${documentUrl}/settings/subscription`);
    // The panel gives way to the settings dialog it opens.
    await expect(userA.sharePanel.linkSwitch).toBeHidden();
  });

  test('an image is only served to people who may open the document', async ({
    userA,
    userB,
  }) => {
    await userA.document.create();
    await userA.document.typeLines(`Private image ${Date.now()}`);
    await sendImage(userA.document.editor, 'paste', await createPng(50, 50));

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

    // Deleting the restored document again closes the dialog as before.
    await userA.sidebar.deleteDocument(heading);
    await expect(userA.page.getByRole('dialog')).toBeHidden();
    await expect(userA.page).not.toHaveURL(url);
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

  test('a collaborator deletes a document only for themselves', async ({
    userA,
    userB,
  }) => {
    const url = await userA.document.create();
    const heading = `Left by User B ${Date.now()}`;
    await userA.document.typeLines(heading);
    const shareUrl = await userA.sharePanel.share();

    await userB.document.open(shareUrl);
    await expect(userB.sidebar.documentInAllDocs(heading)).toBeVisible();

    await userB.sidebar.deleteDocument(heading);

    await expect(userB.page).not.toHaveURL(shareUrl);
    await expect(userB.sidebar.documentInAllDocs(heading)).toBeHidden();
    await userB.page.reload();
    await expect(userB.sidebar.documentInAllDocs(heading)).toBeHidden();
    await userB.sidebar.openDeletedDocs();
    await expect(userB.sidebar.documentInDeleted(heading)).toHaveCount(0);

    // Nothing changed for the owner: still listed, still shared.
    await userA.page.reload();
    await expect(userA.page).toHaveURL(url);
    await expect(userA.sidebar.documentInAllDocs(heading)).toBeVisible();
    await expect(userA.document.deletedNotice).toBeHidden();
    await userB.document.open(shareUrl);
    await expect(userB.document.content).toContainText(heading);
  });

  test('deleting the open document opens the last edited one', async ({
    userA,
  }) => {
    // Each document is stored before the next one is created, which keeps
    // the order they were edited in.
    const createStored = async (heading: string) => {
      const url = await userA.document.create();
      await userA.document.typeLines(heading);
      await expect(async () => {
        await userA.page.reload();
        await expect(userA.sidebar.documentInAllDocs(heading))
          .toBeVisible({ timeout: 3000 });
      }).toPass({ timeout: 15_000 });

      return url;
    };
    const first = await createStored(`First ${Date.now()}`);
    const second = `Second ${Date.now()}`;
    await createStored(second);
    const heading = `Third ${Date.now()}`;
    const third = await createStored(heading);

    // Deleting another document leaves the open one open.
    await userA.sidebar.deleteDocument(second);
    await expect(userA.sidebar.documentInAllDocs(second)).toBeHidden();
    await expect(userA.page).toHaveURL(third);

    await userA.sidebar.deleteDocument(heading);
    await expect(userA.page).toHaveURL(first);
    await expect(userA.document.deletedNotice).toBeHidden();
  });

  test('edits after a restore are persisted', async ({ userA }) => {
    const url = await userA.document.create();
    const heading = `Restored doc ${Date.now()}`;
    await userA.document.typeLines(heading);

    await userA.sidebar.deleteDocument(heading);
    await expect(userA.page).not.toHaveURL(url);
    await userA.page.goto(url);
    await expect(userA.document.deletedNotice).toBeVisible();
    await userA.sidebar.restoreDocument(heading);
    await expect(userA.document.deletedNotice).toBeHidden();

    await userA.document.appendLinesAfter(heading, 'Written after the restore.');

    await expect(async () => {
      await userA.page.reload();
      await expect(userA.document.editor)
        .toContainText('Written after the restore.', { timeout: 3000 });
    }).toPass({ timeout: 15_000 });
  });
});
