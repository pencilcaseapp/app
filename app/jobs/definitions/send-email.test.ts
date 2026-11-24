import { describe, it, expect, vi } from 'vitest';
import { EmailTemplate } from '~/constants/email';
import { sendEmail } from './send-email';
import { sendQueuedEmail } from '~/services/email-templates';

vi.mock('~/services/email-templates');

describe('sendEmail', () => {
  it('sends the e-mail it was queued for', async () => {
    const queued = {
      template: EmailTemplate.ContactMessage,
      input: {
        messageId: 'message-id',
        email: 'sam@example.com',
        message: 'Hello',
      },
    } as const;

    await sendEmail.run(queued);

    expect(sendQueuedEmail).toHaveBeenCalledWith(queued);
  });
});
