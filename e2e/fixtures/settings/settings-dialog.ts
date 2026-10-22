import { expect, type Locator, type Page } from '@playwright/test';

type Section = 'Account' | 'Subscription' | 'Support';

/** `/doc/:id/settings/*`: the settings dialog over the document. */
export class SettingsDialog {
  readonly dialog: Locator;
  readonly nameField: Locator;
  readonly newsletterCheckbox: Locator;
  readonly upgradeLink: Locator;
  readonly manageSubscriptionLink: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByRole('dialog');
    this.nameField = page.getByLabel('Name');
    this.newsletterCheckbox = page.getByLabel('Subscribe to Newsletter');
    this.upgradeLink = this.dialog
      .getByRole('link', { name: 'Upgrade to Pro' });
    this.manageSubscriptionLink = page
      .getByRole('link', { name: 'Manage subscription' });
  }

  /**
   * Opens the dialog from the sidebar, which skips the menu page and
   * lands on the account section on a desktop viewport.
   */
  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Settings' }).click();
    await expect(this.page).toHaveURL(/\/settings\/account$/);
  }

  async openSection(section: Section): Promise<void> {
    await this.page.getByRole('link', { name: section }).click();
    await expect(this.page)
      .toHaveURL(new RegExp(`/settings/${section.toLowerCase()}$`));
  }

  async saveAccount(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save' }).click();
    await expect(this.page.getByText('Your account has been updated'))
      .toBeVisible();
  }

  async close(): Promise<void> {
    await this.page.getByRole('button', { name: 'Close' }).click();
    await expect(this.page).not.toHaveURL(/\/settings/);
  }
}
