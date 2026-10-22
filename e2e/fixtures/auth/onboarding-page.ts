import type { Page } from '@playwright/test';

/** `/onboarding`: shown once, right after an account's first sign-in. */
export class OnboardingPage {
  constructor(readonly page: Page) {}

  async complete(
    { name, newsletter }: { name: string; newsletter: boolean },
  ): Promise<void> {
    await this.page.waitForURL('**/onboarding**');
    await this.page.getByLabel('Name').fill(name);
    await this.page
      .getByLabel(/I want to receive emails/)
      .setChecked(newsletter);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async skip(): Promise<void> {
    await this.page.waitForURL('**/onboarding**');
    await this.page.getByRole('button', { name: 'Skip it' }).click();
  }
}
