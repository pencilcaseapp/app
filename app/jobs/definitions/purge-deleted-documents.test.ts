import { describe, it, expect, vi } from 'vitest';
import { purgeDeletedDocuments } from './purge-deleted-documents';
import { purgeDeletedDocuments as purge } from '~/services/document';

vi.mock('~/services/document');

describe('purgeDeletedDocuments', () => {
  it('runs nightly', () => {
    expect(purgeDeletedDocuments.schedule).toBe('0 4 * * *');
  });

  it('purges documents deleted more than 30 days ago', async () => {
    vi.mocked(purge).mockResolvedValue(2);

    await purgeDeletedDocuments.run();

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const [before] = vi.mocked(purge).mock.calls[0];

    expect(before.getTime()).toBeGreaterThan(thirtyDaysAgo - 5000);
    expect(before.getTime()).toBeLessThanOrEqual(thirtyDaysAgo);
  });
});
