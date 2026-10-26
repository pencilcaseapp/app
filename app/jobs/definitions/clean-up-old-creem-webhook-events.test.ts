import { describe, it, expect, vi } from 'vitest';
import { deleteWebhookEventsReceivedBefore } from '~/repos/creem-webhook-event';
import { cleanUpOldCreemWebhookEvents } from './clean-up-old-creem-webhook-events';

vi.mock('~/repos/creem-webhook-event');

describe('cleanUpOldCreemWebhookEvents', () => {
  it('runs nightly', () => {
    expect(cleanUpOldCreemWebhookEvents.schedule).toBe('0 4 * * *');
  });

  it('deletes events received more than 30 days ago', async () => {
    vi.mocked(deleteWebhookEventsReceivedBefore).mockResolvedValue(4);

    await cleanUpOldCreemWebhookEvents.run();

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const [before]
      = vi.mocked(deleteWebhookEventsReceivedBefore).mock.calls[0];

    expect(before.getTime()).toBeGreaterThan(thirtyDaysAgo - 5000);
    expect(before.getTime()).toBeLessThanOrEqual(thirtyDaysAgo);
  });
});
