import type { JobDefinition } from '../job';
import { DELETED_ACCOUNT_RETENTION_MS } from '~/constants/account';
import { purgeDeletedAccounts as purge } from '~/services/account';

/**
 * Makes good on what the account deletion promises: an account can be
 * restored by signing in for the retention period and is then gone for
 * good, with everything tied to it.
 */
export const purgeDeletedAccounts: JobDefinition = {
  name: 'purge-deleted-accounts',
  schedule: '30 4 * * *',
  run: async () => {
    const before = new Date(Date.now() - DELETED_ACCOUNT_RETENTION_MS);
    const purgedCount = await purge(before);

    console.log(`🧹 Purged ${purgedCount} deleted accounts`);
  },
};
