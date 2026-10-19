import { describe, it, expect, vi } from 'vitest';
import { deleteEmailLogsCreatedBefore } from '~/repos/email-log';
import { cleanUpOldEmailLogs } from './clean-up-old-email-logs';

vi.mock('~/repos/email-log');

describe('cleanUpOldEmailLogs', () => {
  it('runs nightly', () => {
    expect(cleanUpOldEmailLogs.schedule).toBe('0 4 * * *');
  });

  it('deletes logs created more than a year ago', async () => {
    vi.mocked(deleteEmailLogsCreatedBefore).mockResolvedValue(4);

    await cleanUpOldEmailLogs.run();

    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const [before] = vi.mocked(deleteEmailLogsCreatedBefore).mock.calls[0];

    expect(before.getTime()).toBeGreaterThan(oneYearAgo - 5000);
    expect(before.getTime()).toBeLessThanOrEqual(oneYearAgo);
  });
});
