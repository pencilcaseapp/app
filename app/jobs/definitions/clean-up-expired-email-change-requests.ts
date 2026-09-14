import type { JobDefinition } from '../job';
import { deleteEmailChangeRequestsExpiredBefore } from '~/repos/email-change-request';

/**
 * Same as the OTPs: `canRequestEmailChange` rate limits on the requests
 * of the last fifteen minutes, so expired rows stay for a day before they
 * go.
 */
const KEEP_EXPIRED_REQUESTS_FOR = 24 * 60 * 60 * 1000;

export const cleanUpExpiredEmailChangeRequests: JobDefinition = {
  name: 'clean-up-expired-email-change-requests',
  schedule: '0 4 * * *',
  run: async () => {
    const before = new Date(Date.now() - KEEP_EXPIRED_REQUESTS_FOR);
    const deletedCount = await deleteEmailChangeRequestsExpiredBefore(before);

    console.log(`🧹 Deleted ${deletedCount} expired e-mail change requests`);
  },
};
