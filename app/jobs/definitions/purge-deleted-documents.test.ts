import { describe, it, expect, vi } from 'vitest';
import { purgeDeletedDocuments } from './purge-deleted-documents';
import { purgeDocumentsDeletedBefore } from '~/repos/document';

vi.mock('~/repos/document');

describe('purgeDeletedDocuments', () => {
  it('runs nightly', () => {
    expect(purgeDeletedDocuments.schedule).toBe('0 4 * * *');
  });

  it('purges documents deleted more than 30 days ago', async () => {
    vi.mocked(purgeDocumentsDeletedBefore).mockResolvedValue(2);

    await purgeDeletedDocuments.run();

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const [before] = vi.mocked(purgeDocumentsDeletedBefore).mock.calls[0];

    expect(before.getTime()).toBeGreaterThan(thirtyDaysAgo - 5000);
    expect(before.getTime()).toBeLessThanOrEqual(thirtyDaysAgo);
  });
});
