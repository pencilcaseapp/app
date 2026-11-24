import type { OnDemandJobDefinition } from '../job';
import { sendQueuedEmail } from '~/services/email-templates';

/**
 * The e-mails nobody waits on (`queueEmail`), sent apart from the request
 * that caused them so a mail provider that is down only delays them: a
 * failed send throws and the queue tries again with backoff.
 */
export const sendEmail: OnDemandJobDefinition<'send-email'> = {
  name: 'send-email',
  run: async (queued) => {
    await sendQueuedEmail(queued);
  },
};
