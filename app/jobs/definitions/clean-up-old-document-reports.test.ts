import { describe, it, expect, vi } from 'vitest';
import { deleteDocumentReportsCreatedBefore } from '~/repos/document-report';
import { cleanUpOldDocumentReports } from './clean-up-old-document-reports';

vi.mock('~/repos/document-report');

describe('cleanUpOldDocumentReports', () => {
  it('runs nightly', () => {
    expect(cleanUpOldDocumentReports.schedule).toBe('0 4 * * *');
  });

  it('deletes reports created more than a year ago', async () => {
    vi.mocked(deleteDocumentReportsCreatedBefore).mockResolvedValue(2);

    await cleanUpOldDocumentReports.run();

    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const [before]
      = vi.mocked(deleteDocumentReportsCreatedBefore).mock.calls[0];

    expect(before.getTime()).toBeGreaterThan(oneYearAgo - 5000);
    expect(before.getTime()).toBeLessThanOrEqual(oneYearAgo);
  });
});
