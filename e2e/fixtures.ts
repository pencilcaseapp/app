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

/**
 * One signed in user driving one browser context, wrapping the flows the
 * specs share so a test reads as the scenario it covers.
 */
export class AppUser {
  constructor(readonly page: Page) {}

  get editor(): Locator {
    return this.page.locator('[contenteditable="true"]');
  }

  /** A document link inside the sidebar's "All Docs" group. */
  documentInAllDocs(title: string): Locator {
    return this.page
      .locator('li')
      .filter({ has: this.page.getByRole('button', { name: 'All Docs' }) })
      .getByRole('link', { name: title });
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
    await expect(this.editor.locator('h1')).toBeVisible();
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
   * The switch flips optimistically, so this waits for the share action's
   * round trip — without it the link could be opened (or access expected
   * to be gone) before the server has committed the change.
   */
  private async setSharing(shared: boolean): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Share', exact: true })
      .click();

    const toggle = this.page.getByRole('switch', { name: 'Share document' });
    await expect(toggle).toBeChecked({ checked: !shared });

    const documentId = this.page.url().split('/').pop() ?? '';
    const saved = this.page.waitForResponse(response =>
      response.request().method() === 'POST'
      && response.url().includes(documentId),
    );
    await toggle.click();
    expect((await saved).ok()).toBeTruthy();

    await expect(toggle).toBeChecked({ checked: shared });
    await this.page.keyboard.press('Escape');
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
  const response = await context.request.post('/e2e/auth', {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    data: {
      email: `e2e-${name}-${randomUUID()}@pencilcase.app`,
    },
  });

  expect(response.ok()).toBeTruthy();

  await provide(new AppUser(await context.newPage()));
  await context.close();
}
