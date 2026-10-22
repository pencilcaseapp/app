import { test as setup } from '@playwright/test';
import { signIn } from '../utils/sign-in';
import { createTestAccountEmail } from '../utils/test-accounts';

setup('sign in as a test account', async ({ page }) => {
  await signIn(page, createTestAccountEmail('user'));

  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
