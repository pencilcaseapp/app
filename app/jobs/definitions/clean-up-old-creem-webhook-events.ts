import type { JobDefinition } from '../job';
import { deleteWebhookEventsReceivedBefore } from '~/repos/creem-webhook-event';

const KEEP_WEBHOOK_EVENTS_FOR = 30 * 24 * 60 * 60 * 1000;

export const cleanUpOldCreemWebhookEvents: JobDefinition = {
  name: 'clean-up-old-creem-webhook-events',
  schedule: '0 4 * * *',
  run: async () => {
    const before = new Date(Date.now() - KEEP_WEBHOOK_EVENTS_FOR);
    const deletedCount = await deleteWebhookEventsReceivedBefore(before);

    console.log(
      `🧹 Deleted ${deletedCount} Creem webhook events older than 30 days`,
    );
  },
};
