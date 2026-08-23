import type { JobDefinition } from '../job';
import { deleteSessionsExpiredBefore } from '~/repos/user';

export const cleanUpExpiredSessions: JobDefinition = {
  name: 'clean-up-expired-sessions',
  schedule: '0 4 * * *',
  run: async () => {
    const deletedCount = await deleteSessionsExpiredBefore(new Date());

    console.log(`🧹 Deleted ${deletedCount} expired sessions`);
  },
};
