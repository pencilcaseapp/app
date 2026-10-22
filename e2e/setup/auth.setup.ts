import { test as setup } from '@playwright/test';
import { createTestAccountEmail, signIn } from '../utils/sign-in';

setup('sign in as a test account', async ({ page }) => {
  await signIn(page, createTestAccountEmail('user'));

  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
