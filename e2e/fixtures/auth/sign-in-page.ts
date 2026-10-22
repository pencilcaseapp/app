import type { Locator, Page } from '@playwright/test';

/** `/signin`: asks for the address a code goes to. */
export class SignInPage {
  readonly emailField: Locator;
  readonly expiredNotice: Locator;
  readonly tooManyRequestsError: Locator;

  constructor(readonly page: Page) {
    this.emailField = page.getByLabel('E-Mail');
    this.expiredNotice = page.getByText('Code has expired. Please try again.');
    this.tooManyRequestsError = page
      .getByText('Too many requests. Please try again later.');
  }

  async goto(returnUrl?: string): Promise<void> {
    await this.page.goto(returnUrl
      ? `/signin?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/signin');
  }

  async submitEmail(email: string): Promise<void> {
    await this.emailField.fill(email);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  /** Asks for a code and waits for the code page. */
  async requestCode(email: string): Promise<void> {
    await this.submitEmail(email);
    await this.page.waitForURL('**/otp/**');
  }
}
