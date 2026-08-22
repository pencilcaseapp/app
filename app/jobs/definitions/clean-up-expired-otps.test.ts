import { describe, it, expect, vi } from 'vitest';
import { cleanUpExpiredOtps } from './clean-up-expired-otps';
import { deleteOtpsExpiredBefore } from '~/repos/otp';

vi.mock('~/repos/otp');

describe('cleanUpExpiredOtps', () => {
  it('runs nightly', () => {
    expect(cleanUpExpiredOtps.schedule).toBe('0 4 * * *');
  });

  it('deletes otps that expired more than a day ago', async () => {
    vi.mocked(deleteOtpsExpiredBefore).mockResolvedValue(3);

    await cleanUpExpiredOtps.run();

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const [before] = vi.mocked(deleteOtpsExpiredBefore).mock.calls[0];

    expect(before.getTime()).toBeGreaterThan(oneDayAgo - 5000);
    expect(before.getTime()).toBeLessThanOrEqual(oneDayAgo);
  });
});
