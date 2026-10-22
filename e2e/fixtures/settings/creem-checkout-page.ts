import { expect, type Page } from '@playwright/test';

/**
 * Creem's hosted checkout. It is not our page, so this is the one place
 * to adjust when it changes.
 */
export class CreemCheckoutPage {
  constructor(readonly page: Page) {}

  /**
   * Step one wants the full name and a billing address (the email is
   * prefilled and locked); step two holds the card fields inside the
   * payment provider's iframe, with the cardholder name and the pay
   * button outside it. 4111… is Creem's always-succeeding test card;
   * expiry, CVC and the billing address can be anything.
   *
   * The cardholder name is typed key by key before the card fields: the
   * provider's input only reacts to key events, so a fill leaves it
   * empty, it drops digits, and its SDK pulls the focus back into the
   * iframe right after a card field changes, so text typed in that
   * moment lands in the CVC.
   */
  async payWithTestCard(): Promise<void> {
    const { page } = this;
    await page.waitForURL('**creem.io/**', { timeout: 30_000 });

    await page.getByRole('textbox', { name: 'Full name' })
      .fill('E2E Tester');

    await page.getByRole('textbox', { name: 'Address line 1' })
      .fill('123 Test Street');
    await page.getByRole('textbox', { name: 'City' }).fill('Los Angeles');
    await page.getByRole('textbox', { name: 'Postal Code' }).fill('90001');
    await page.getByRole('combobox').filter({ hasText: /^State$/ }).click();
    await page.getByRole('option', { name: 'California' }).click();

    await page.getByRole('button', { name: 'Continue to payment' }).click();

    const cardholderName
      = page.getByRole('textbox', { name: 'Cardholder Name' });
    await cardholderName.click();
    await cardholderName.pressSequentially('Test Buyer');

    const cardFrame = page.frameLocator('iframe[title="card_form"]');
    await cardFrame.getByRole('textbox', { name: 'Card number' })
      .fill('4111111111111111');
    await cardFrame.getByRole('textbox', { name: 'MM/YY' }).fill('12/30');
    await cardFrame.getByRole('textbox', { name: 'CVC/CVV' }).fill('123');

    await expect(cardholderName).toHaveValue('Test Buyer');
    await page.getByRole('button', { name: /^Pay €/ }).click();
  }
}
