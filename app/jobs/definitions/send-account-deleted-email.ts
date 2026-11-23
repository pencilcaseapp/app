import type { OnDemandJobDefinition } from '../job';
import { sendAccountDeletedEmail as send } from '~/services/account';

/**
 * The confirmation of an account deletion, sent apart from the deletion
 * so a mail provider that is down only delays it: a failed send throws
 * and the queue tries again with backoff.
 */
export const sendAccountDeletedEmail: OnDemandJobDefinition<'send-account-deleted-email'> = {
  name: 'send-account-deleted-email',
  run: async ({ userId, deletedAt }) => {
    await send(userId, new Date(deletedAt));
  },
};
