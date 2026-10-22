import type { Locator, Page } from '@playwright/test';
import { TEST_ACCOUNT_CODE } from '../../utils/test-accounts';

/** `/otp/:otpId`: takes the code that was sent to the address. */
export class OtpPage {
  readonly codeField: Locator;
  readonly invalidCodeError: Locator;

  constructor(readonly page: Page) {
    this.codeField = page.getByLabel('One-Time Password');
    this.invalidCodeError = page
      .getByText('Invalid code. Please check the code');
  }

  async enterCode(code = TEST_ACCOUNT_CODE): Promise<void> {
    // The field keeps a rejected code, and filling over it only replaces
    // the last digit.
    await this.codeField.clear();
    await this.codeField.fill(code);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }
}
