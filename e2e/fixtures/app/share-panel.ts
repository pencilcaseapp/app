import { expect, type Locator, type Page } from '@playwright/test';
import { waitForPost } from './wait-for-post';

/** The share panel behind the document's Share button. */
export class SharePanel {
  constructor(readonly page: Page) {}

  get linkSwitch(): Locator {
    return this.page.getByRole('switch', { name: 'Anyone with the link' });
  }

  async open(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Share', exact: true })
      .click();
    await expect(this.linkSwitch).toBeVisible();
  }

  /**
   * Closing runs an animation, and the panel's contents only leave when it
   * is over — a flow that reopens the panel before then would find the old
   * contents and lose them mid-click.
   */
  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.linkSwitch).toBeHidden();
  }

  /** Turns sharing on and returns the link to hand to another user. */
  async share(): Promise<string> {
    await this.setSharing(true);

    return this.page.url();
  }

  async unshare(): Promise<void> {
    await this.setSharing(false);
  }

  /**
   * Picks what anyone with the link may do. Like the switch the chooser
   * changes optimistically, so this waits for the round trip before the
   * other user is expected to notice.
   */
  async setLinkAccess(label: 'Can view' | 'Can edit'): Promise<void> {
    await this.open();

    const select = this.page
      .getByRole('combobox', { name: 'Link access' });
    const saved = waitForPost(this.page, '/link-access');

    await select.click();
    await this.page.getByRole('option', { name: label }).click();
    expect((await saved).ok()).toBeTruthy();

    await expect(select).toHaveText(label);
    await this.close();
  }

  /**
   * The switch flips optimistically, so this waits for the share action's
   * round trip — without it the link could be opened (or access expected
   * to be gone) before the server has committed the change.
   */
  private async setSharing(shared: boolean): Promise<void> {
    await this.open();
    await expect(this.linkSwitch).toBeChecked({ checked: !shared });

    const documentId = this.page.url().split('/').pop() ?? '';
    const saved = this.page.waitForResponse(response =>
      response.request().method() === 'POST'
      && response.url().includes(documentId),
    );
    await this.linkSwitch.click();
    expect((await saved).ok()).toBeTruthy();

    await expect(this.linkSwitch).toBeChecked({ checked: shared });
    await this.close();
  }
}
