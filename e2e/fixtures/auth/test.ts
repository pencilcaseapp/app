import { test as base } from '../test';
import { OnboardingPage } from './onboarding-page';
import { OtpPage } from './otp-page';
import { SignInPage } from './sign-in-page';

interface AuthFixtures {
  signInPage: SignInPage;
  otpPage: OtpPage;
  onboardingPage: OnboardingPage;
}

/**
 * The auth domain's test: `page` starts without a session, and the
 * sign-in, code and onboarding pages are handed out on top of it.
 */
export const test = base.extend<AuthFixtures>({
  storageState: { cookies: [], origins: [] },
  signInPage: async ({ page }, provide) => {
    await provide(new SignInPage(page));
  },
  otpPage: async ({ page }, provide) => {
    await provide(new OtpPage(page));
  },
  onboardingPage: async ({ page }, provide) => {
    await provide(new OnboardingPage(page));
  },
});

export { expect } from '@playwright/test';
