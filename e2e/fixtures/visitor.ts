import type { Locator, Page } from '@playwright/test';
import { TEST_ACCOUNT_CODE } from '../utils/test-accounts';

/**
 * Somebody without a session driving one browser context through the
 * sign-in, the code page and the onboarding.
 */
export class Visitor {
  constructor(readonly page: Page) {}

  get emailField(): Locator {
    return this.page.getByLabel('E-Mail');
  }

  get codeField(): Locator {
    return this.page.getByLabel('One-Time Password');
  }

  get invalidCodeError(): Locator {
    return this.page.getByText('Invalid code. Please check the code');
  }

  get expiredNotice(): Locator {
    return this.page.getByText('Code has expired. Please try again.');
  }

  get tooManyRequestsError(): Locator {
    return this.page.getByText('Too many requests. Please try again later.');
  }

  /**
   * Signs a test account in and skips the onboarding. It returns to the
   * sign-in page rather than the start page, which would create a
   * document and leave it in the user's sidebar.
   */
  async signIn(email: string): Promise<void> {
    await this.page.goto('/signin?returnUrl=/signin');
    await this.requestCode(email);
    await this.enterCode();
    await this.skipOnboarding();
    await this.page.waitForURL('**/signin**');
  }

  /** Submits an address on the sign-in page the browser is on. */
  async submitEmail(email: string): Promise<void> {
    await this.emailField.fill(email);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  /** Asks for a code and waits for the code page. */
  async requestCode(email: string): Promise<void> {
    await this.submitEmail(email);
    await this.page.waitForURL('**/otp/**');
  }

  /** Submits a code on the code page the browser is on. */
  async enterCode(code = TEST_ACCOUNT_CODE): Promise<void> {
    // The field keeps a rejected code, and filling over it only replaces
    // the last digit.
    await this.codeField.clear();
    await this.codeField.fill(code);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async completeOnboarding(
    { name, newsletter }: { name: string; newsletter: boolean },
  ): Promise<void> {
    await this.page.waitForURL('**/onboarding**');
    await this.page.getByLabel('Name').fill(name);
    await this.page
      .getByLabel(/I want to receive emails/)
      .setChecked(newsletter);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async skipOnboarding(): Promise<void> {
    await this.page.waitForURL('**/onboarding**');
    await this.page.getByRole('button', { name: 'Skip it' }).click();
  }
}
