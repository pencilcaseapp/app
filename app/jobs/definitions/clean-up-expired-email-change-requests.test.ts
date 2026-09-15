import { describe, it, expect, vi } from 'vitest';
import { deleteEmailChangeRequestsExpiredBefore } from '~/repos/email-change-request';
import { cleanUpExpiredEmailChangeRequests } from './clean-up-expired-email-change-requests';

vi.mock('~/repos/email-change-request');

describe('cleanUpExpiredEmailChangeRequests', () => {
  it('runs nightly', () => {
    expect(cleanUpExpiredEmailChangeRequests.schedule).toBe('0 4 * * *');
  });

  it('deletes requests that expired more than a day ago', async () => {
    vi.mocked(deleteEmailChangeRequestsExpiredBefore).mockResolvedValue(2);

    await cleanUpExpiredEmailChangeRequests.run();

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const [before]
      = vi.mocked(deleteEmailChangeRequestsExpiredBefore).mock.calls[0];

    expect(before.getTime()).toBeGreaterThan(oneDayAgo - 5000);
    expect(before.getTime()).toBeLessThanOrEqual(oneDayAgo);
  });
});
