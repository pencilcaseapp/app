import type { JobDefinition } from '../job';
import { deleteEmailLogsCreatedBefore } from '~/repos/email-log';

const KEEP_EMAIL_LOGS_FOR = 365 * 24 * 60 * 60 * 1000;

export const cleanUpOldEmailLogs: JobDefinition = {
  name: 'clean-up-old-email-logs',
  schedule: '0 4 * * *',
  run: async () => {
    const before = new Date(Date.now() - KEEP_EMAIL_LOGS_FOR);
    const deletedCount = await deleteEmailLogsCreatedBefore(before);

    console.log(`🧹 Deleted ${deletedCount} e-mail logs older than a year`);
  },
};
