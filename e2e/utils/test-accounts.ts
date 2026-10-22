import { randomUUID } from 'node:crypto';

/** Any address at this domain is a test account in dev and test. */
const TEST_ACCOUNT_DOMAIN = 'pencilcase.test';

/** The fixed code of the test accounts, see `config.testAccounts`. */
export const TEST_ACCOUNT_CODE = '000000';

/** A test account nobody has used before. */
export function createTestAccountEmail(name: string) {
  return `e2e-${name}-${randomUUID()}@${TEST_ACCOUNT_DOMAIN}`;
}
