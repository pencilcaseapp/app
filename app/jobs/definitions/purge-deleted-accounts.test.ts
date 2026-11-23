import { describe, it, expect, vi } from 'vitest';
import { purgeDeletedAccounts } from './purge-deleted-accounts';
import { purgeDeletedAccounts as purge } from '~/services/account';

vi.mock('~/services/account');

describe('purgeDeletedAccounts', () => {
  it('runs nightly, after the documents', () => {
    expect(purgeDeletedAccounts.schedule).toBe('30 4 * * *');
  });

  it('purges accounts deleted more than 30 days ago', async () => {
    vi.mocked(purge).mockResolvedValue(1);

    await purgeDeletedAccounts.run();

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const [before] = vi.mocked(purge).mock.calls[0];

    expect(before.getTime()).toBeGreaterThan(thirtyDaysAgo - 5000);
    expect(before.getTime()).toBeLessThanOrEqual(thirtyDaysAgo);
  });
});
