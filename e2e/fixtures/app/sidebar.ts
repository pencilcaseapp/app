import { expect, type Locator, type Page } from '@playwright/test';
import { waitForPost } from './wait-for-post';

type SidebarGroup = 'All Docs' | 'Deleted';

/** The navigation next to the document: its groups and row menus. */
export class Sidebar {
  constructor(readonly page: Page) {}

  get upgradeLink(): Locator {
    return this.page.getByRole('link', { name: 'Upgrade to Pro' });
  }

  /** A document link inside the "All Docs" group. */
  documentInAllDocs(title: string): Locator {
    return this.group('All Docs').getByRole('link', { name: title });
  }

  /**
   * A document link inside the "Deleted" group. The group starts
   * collapsed, see `openDeletedDocs`.
   */
  documentInDeleted(title: string): Locator {
    return this.group('Deleted').getByRole('link', { name: title });
  }

  async openDeletedDocs(): Promise<void> {
    const trigger = this.page.getByRole('button', { name: 'Deleted' });

    if (await trigger.getAttribute('data-state') !== 'open') {
      await trigger.click();
    }
  }

  /**
   * Deletes the document through its row menu and the confirmation, or
   * removes it from the user's documents when somebody else owns it.
   */
  async deleteDocument(title: string): Promise<void> {
    await this.openDocumentMenu('All Docs', title);
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();

    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toContainText(`“${title}” will be`);

    const deleted = waitForPost(this.page, '/delete', '/leave');
    await dialog.getByRole('button', { name: 'Delete' }).click();
    expect((await deleted).ok()).toBeTruthy();
  }

  /** Restores the document from the "Deleted" group's row menu. */
  async restoreDocument(title: string): Promise<void> {
    await this.openDeletedDocs();
    await this.openDocumentMenu('Deleted', title);

    const restored = waitForPost(this.page, '/restore');
    await this.page.getByRole('menuitem', { name: 'Restore' }).click();
    expect((await restored).ok()).toBeTruthy();
  }

  /** The options button of a document's row, which shows on hover. */
  documentMenuTrigger(group: SidebarGroup, title: string): Locator {
    return this.documentRow(group, title)
      .getByRole('button', { name: 'Item options' });
  }

  private group(name: SidebarGroup): Locator {
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
    return this.group(group)
      .locator('div')
      .filter({ has: this.page.getByText(title, { exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: 'Item options' }) })
      .last();
  }

  private async openDocumentMenu(
    group: SidebarGroup,
    title: string,
  ): Promise<void> {
    await this.group(group).getByText(title, { exact: true }).hover();
    await this.documentMenuTrigger(group, title).click();
  }
}
