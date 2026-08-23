import { describe, it, expect, vi } from 'vitest';
import { cleanUpExpiredSessions } from './clean-up-expired-sessions';
import { deleteSessionsExpiredBefore } from '~/repos/user';

vi.mock('~/repos/user');

describe('cleanUpExpiredSessions', () => {
  it('runs nightly', () => {
    expect(cleanUpExpiredSessions.schedule).toBe('0 4 * * *');
  });

  it('deletes sessions that have expired', async () => {
    vi.mocked(deleteSessionsExpiredBefore).mockResolvedValue(3);

    const now = Date.now();

    await cleanUpExpiredSessions.run();

    const [before] = vi.mocked(deleteSessionsExpiredBefore).mock.calls[0];

    expect(before.getTime()).toBeGreaterThanOrEqual(now);
    expect(before.getTime()).toBeLessThan(now + 5000);
  });
});
