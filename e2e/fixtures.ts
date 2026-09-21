import { randomUUID } from 'node:crypto';
import {
  expect,
  test as base,
  type Browser,
  type Locator,
  type Page,
} from '@playwright/test';

/**
 * Matches the default in `app/config/dev.ts`; set E2E_API_TOKEN to
 * override both sides at once.
 */
const apiToken = process.env.E2E_API_TOKEN ?? 'e2e-t0k3n';

type SidebarGroup = 'All Docs' | 'Deleted';

/**
 * One signed in user driving one browser context, wrapping the flows the
 * specs share so a test reads as the scenario it covers.
 */
export class AppUser {
  constructor(readonly page: Page, readonly email?: string) {}

  get editor(): Locator {
    return this.page.locator('[contenteditable="true"]');
  }

  /** The document's content, whether or not the viewer may change it. */
  get content(): Locator {
    return this.page.locator('[contenteditable]');
  }

  /** A document link inside the sidebar's "All Docs" group. */
  documentInAllDocs(title: string): Locator {
    return this.sidebarGroup('All Docs').getByRole('link', { name: title });
  }

  /**
   * A document link inside the sidebar's "Deleted" group. The group starts
   * collapsed, see `openDeletedDocs`.
   */
  documentInDeleted(title: string): Locator {
    return this.sidebarGroup('Deleted').getByRole('link', { name: title });
  }

  /** The notice a deleted document shows above its read-only content. */
  get deletedNotice(): Locator {
    return this.page.getByText('This document is deleted');
  }

  async openDeletedDocs(): Promise<void> {
    const trigger = this.page.getByRole('button', { name: 'Deleted' });

    if (await trigger.getAttribute('data-state') !== 'open') {
      await trigger.click();
    }
  }

  /** Deletes the document through its row menu and the confirmation. */
  async deleteDocument(title: string): Promise<void> {
    await this.openDocumentMenu('All Docs', title);
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();

    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toContainText(`“${title}” will be`);

    const deleted = this.waitForPost('/delete');
    await dialog.getByRole('button', { name: 'Delete' }).click();
    expect((await deleted).ok()).toBeTruthy();
  }

  /** Restores the document from the "Deleted" group's row menu. */
  async restoreDocument(title: string): Promise<void> {
    await this.openDeletedDocs();
    await this.openDocumentMenu('Deleted', title);

    const restored = this.waitForPost('/restore');
    await this.page.getByRole('menuitem', { name: 'Restore' }).click();
    expect((await restored).ok()).toBeTruthy();
  }

  /** The options button of a document's row, which shows on hover. */
  documentMenuTrigger(group: SidebarGroup, title: string): Locator {
    return this.documentRow(group, title)
      .getByRole('button', { name: 'Item options' });
  }

  private sidebarGroup(name: SidebarGroup): Locator {
    return this.page
      .locator('li')
      .filter({ has: this.page.getByRole('button', { name, exact: true }) });
  }

  /**
   * The row wrapping a document's title together with its menu: the
   * innermost `div` of the group holding both, which comes last in
   * document order.
   */
  private documentRow(group: SidebarGroup, title: string): Locator {
    return this.sidebarGroup(group)
      .locator('div')
      .filter({ has: this.page.getByText(title, { exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: 'Item options' }) })
      .last();
  }

  private async openDocumentMenu(
    group: SidebarGroup,
    title: string,
  ): Promise<void> {
    await this.sidebarGroup(group).getByText(title, { exact: true }).hover();
    await this.documentMenuTrigger(group, title).click();
  }

  /** Fetcher submissions post to the route's `.data` URL. */
  private waitForPost(routeSegment: string) {
    return this.page.waitForResponse(response =>
      response.request().method() === 'POST'
      && new URL(response.url()).pathname.includes(routeSegment),
    );
  }

  /**
   * Creates a document through /new and returns its URL, which doubles as
   * the share link.
   */
  async createDocument(): Promise<string> {
    await this.page.goto('/new');
    await this.page.waitForURL('**/doc/**');
    await this.waitForEditorSynced();

    return this.page.url();
  }

  async openDocument(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForEditorSynced();
  }

  /**
   * Every document starts as an empty `h1` seeded on the server, and the
   * editor only renders it once the websocket has delivered the initial
   * state — typing before that races the sync, and the first line would
   * not reliably end up in the heading the title is extracted from.
   */
  async waitForEditorSynced(): Promise<void> {
    await expect(this.content.locator('h1')).toBeVisible();
  }

  /** Types into the editor, one block per line. */
  async typeLines(...lines: string[]): Promise<void> {
    await this.editor.click();

    for (const [index, line] of lines.entries()) {
      if (index > 0) {
        await this.page.keyboard.press('Enter');
      }
      await this.page.keyboard.type(line);
    }

    await expect(this.editor).toContainText(lines[lines.length - 1]);
  }

  /** Appends new blocks after the block containing `text`. */
  async appendLinesAfter(text: string, ...lines: string[]): Promise<void> {
    await this.editor.getByText(text).click();
    await this.page.keyboard.press('End');

    for (const line of lines) {
      await this.page.keyboard.press('Enter');
      await this.page.keyboard.type(line);
    }

    await expect(this.editor).toContainText(lines[lines.length - 1]);
  }

  /** Turns sharing on and returns the link to hand to another user. */
  async shareDocument(): Promise<string> {
    await this.setSharing(true);

    return this.page.url();
  }

  async unshareDocument(): Promise<void> {
    await this.setSharing(false);
  }

  /**
   * Picks what anyone with the link may do. Like the switch the chooser
   * changes optimistically, so this waits for the round trip before the
   * other user is expected to notice.
   */
  async setLinkAccess(label: 'Can view' | 'Can edit'): Promise<void> {
    await this.openSharePanel();

    const select = this.page
      .getByRole('combobox', { name: 'Link access' });
    const saved = this.waitForPost('/link-access');

    await select.click();
    await this.page.getByRole('option', { name: label }).click();
    expect((await saved).ok()).toBeTruthy();

    await expect(select).toHaveText(label);
    await this.closeSharePanel();
  }

  private sharingToggle(): Locator {
    return this.page.getByRole('switch', { name: 'Anyone with the link' });
  }

  async openSharePanel(): Promise<Locator> {
    await this.page
      .getByRole('button', { name: 'Share', exact: true })
      .click();
    await expect(this.sharingToggle()).toBeVisible();

    return this.sharingToggle();
  }

  /**
   * Closing runs an animation, and the panel's contents only leave when it
   * is over — a flow that reopens the panel before then would find the old
   * contents and lose them mid-click.
   */
  private async closeSharePanel(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.sharingToggle()).toBeHidden();
  }

  /**
   * The switch flips optimistically, so this waits for the share action's
   * round trip — without it the link could be opened (or access expected
   * to be gone) before the server has committed the change.
   */
  private async setSharing(shared: boolean): Promise<void> {
    const toggle = await this.openSharePanel();
    await expect(toggle).toBeChecked({ checked: !shared });

    const documentId = this.page.url().split('/').pop() ?? '';
    const saved = this.page.waitForResponse(response =>
      response.request().method() === 'POST'
      && response.url().includes(documentId),
    );
    await toggle.click();
    expect((await saved).ok()).toBeTruthy();

    await expect(toggle).toBeChecked({ checked: shared });
    await this.closeSharePanel();
  }
}

interface AppUserFixtures {
  /** The shared storage-state user signed in by `auth.setup.ts`. */
  user: AppUser;
  /** A user created fresh for this test, in a context of their own. */
  userA: AppUser;
  /** A second fresh user, isolated from `userA`. */
  userB: AppUser;
}

// Playwright calls the second fixture parameter `use`, which the React
// hooks lint rule reads as a hook — `provide` is the same callback.
export const test = base.extend<AppUserFixtures>({
  user: async ({ page }, provide) => {
    await provide(new AppUser(page));
  },
  userA: async ({ browser, baseURL }, provide) => {
    await provideFreshUser(browser, baseURL, 'a', provide);
  },
  userB: async ({ browser, baseURL }, provide) => {
    await provideFreshUser(browser, baseURL, 'b', provide);
  },
});

export { expect };

/**
 * Signs a brand new user in through `POST /e2e/auth` in a browser context
 * of their own, so a test can put several users into the same document
 * without them sharing cookies. A fresh user also keeps the sidebar
 * assertions independent of documents left behind by earlier runs.
 */
async function provideFreshUser(
  browser: Browser,
  baseURL: string | undefined,
  name: string,
  provide: (user: AppUser) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({ baseURL });
  const email = `e2e-${name}-${randomUUID()}@pencilcase.app`;
  const response = await context.request.post('/e2e/auth', {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    data: {
      email,
    },
  });

  expect(response.ok()).toBeTruthy();

  await provide(new AppUser(await context.newPage(), email));
  await context.close();
}
