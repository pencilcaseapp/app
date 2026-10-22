import type { Page } from '@playwright/test';
import { OnboardingPage } from '../fixtures/auth/onboarding-page';
import { OtpPage } from '../fixtures/auth/otp-page';
import { SignInPage } from '../fixtures/auth/sign-in-page';

/**
 * Signs a test account in through the real form and skips the onboarding.
 * Both return to the sign-in page rather than the start page, which would
 * create a document and leave it in the user's sidebar.
 */
export async function signIn(page: Page, email: string) {
  const signInPage = new SignInPage(page);
  await signInPage.goto('/signin');
  await signInPage.requestCode(email);
  await new OtpPage(page).enterCode();
  await new OnboardingPage(page).skip();
  await page.waitForURL('**/signin**');
}
