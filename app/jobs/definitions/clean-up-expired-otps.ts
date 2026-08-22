import type { JobDefinition } from '../job';
import { deleteOtpsExpiredBefore } from '~/repos/otp';

/**
 * Expired rows stick around for a day before deletion: `canRequestNewOtp`
 * rate limits on the OTPs created in the last fifteen minutes, and deleting
 * a row the moment it expires would reset that window.
 */
const KEEP_EXPIRED_OTPS_FOR = 24 * 60 * 60 * 1000;

export const cleanUpExpiredOtps: JobDefinition = {
  name: 'clean-up-expired-otps',
  schedule: '0 4 * * *',
  run: async () => {
    const before = new Date(Date.now() - KEEP_EXPIRED_OTPS_FOR);
    const deletedCount = await deleteOtpsExpiredBefore(before);

    console.log(`🧹 Deleted ${deletedCount} expired OTPs`);
  },
};
