import { test as setup } from '@playwright/test';
import { Visitor } from '../fixtures/visitor';
import { createTestAccountEmail } from '../utils/test-accounts';

setup('sign in as a test account', async ({ page }) => {
  await new Visitor(page).signIn(createTestAccountEmail('user'));

  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
