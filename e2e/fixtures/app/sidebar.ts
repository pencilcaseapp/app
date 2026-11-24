import { expect, type Locator, type Page } from '@playwright/test';
import { waitForPost } from './wait-for-post';

type SidebarFolder = 'All Docs' | 'Shared with you' | 'Deleted';

/** The navigation next to the document: its folders and row menus. */
export class Sidebar {
  constructor(readonly page: Page) {}

  get upgradeLink(): Locator {
    return this.page.getByRole('link', { name: 'Upgrade to Pro' });
  }

  /** A document link in the folder the navigation lists, see `openFolder`. */
  document(title: string): Locator {
    return this.list.getByRole('link', { name: title });
  }

  /** Lists another folder through the switch on top of the navigation. */
  async openFolder(folder: SidebarFolder): Promise<void> {
    const trigger = this.page.locator('nav').getByRole('combobox');

    if ((await trigger.textContent())?.startsWith(folder)) {
      return;
    }

    await trigger.click();
    await this.page
      .getByRole('option', { name: new RegExp(`^${folder}`) })
      .click();
    await expect(this.page.locator('nav [aria-busy=true]')).toHaveCount(0);
  }

  /**
   * Deletes the document through its row menu and the confirmation, or
   * removes it from the user's documents when somebody else owns it.
   */
  async deleteDocument(title: string): Promise<void> {
    await this.openFolder('All Docs');
    await this.openDocumentMenu(title);
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();

    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toContainText(`“${title}” will be`);

    const deleted = waitForPost(this.page, '/delete', '/leave');
    await dialog.getByRole('button', { name: 'Delete' }).click();
    expect((await deleted).ok()).toBeTruthy();
  }

  /** Restores the document from its row menu in the Deleted folder. */
  async restoreDocument(title: string): Promise<void> {
    await this.openFolder('Deleted');
    await this.openDocumentMenu(title);

    const restored = waitForPost(this.page, '/restore');
    await this.page.getByRole('menuitem', { name: 'Restore' }).click();
    expect((await restored).ok()).toBeTruthy();
  }

  /**
   * A document link of the open folder that says it is pinned, which the
   * row reads out after its title and share state.
   */
  pinnedDocument(title: string): Locator {
    return this.document(title)
      .and(this.list.getByRole('link', { name: /, pinned$/ }));
  }

  /** The topmost document of the open folder. */
  get firstDocument(): Locator {
    return this.list.getByRole('link').first();
  }

  /** Pins or unpins the document through its row menu. */
  async setPinned(title: string, pinned: boolean): Promise<void> {
    await this.openDocumentMenu(title);

    const saved = waitForPost(this.page, '/pin');
    await this.page
      .getByRole('menuitem', { name: pinned ? 'Pin' : 'Unpin' })
      .click();
    expect((await saved).ok()).toBeTruthy();
  }

  /** The options button of a document's row, which shows on hover. */
  documentMenuTrigger(title: string): Locator {
    return this.documentRow(title)
      .getByRole('button', { name: 'Item options' });
  }

  /** The documents of the open folder, below the switch. */
  private get list(): Locator {
    return this.page.locator('nav ul[aria-label]');
  }

  /**
   * The row wrapping a document's title together with its menu: the
   * innermost `div` of the list holding both, which comes last in
   * document order.
   */
  private documentRow(title: string): Locator {
    return this.list
      .locator('div')
      .filter({ has: this.page.getByText(title, { exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: 'Item options' }) })
      .last();
  }

  private async openDocumentMenu(title: string): Promise<void> {
    await this.list.getByText(title, { exact: true }).hover();
    await this.documentMenuTrigger(title).click();
  }
}
