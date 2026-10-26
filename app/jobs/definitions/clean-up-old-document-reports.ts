import type { JobDefinition } from '../job';
import { DOCUMENT_REPORT_RETENTION_DAYS } from '~/constants/document';
import { deleteDocumentReportsCreatedBefore } from '~/repos/document-report';

const KEEP_REPORTS_FOR = DOCUMENT_REPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export const cleanUpOldDocumentReports: JobDefinition = {
  name: 'clean-up-old-document-reports',
  schedule: '0 4 * * *',
  run: async () => {
    const before = new Date(Date.now() - KEEP_REPORTS_FOR);
    const deletedCount = await deleteDocumentReportsCreatedBefore(before);

    console.log(
      `🧹 Deleted ${deletedCount} document reports older than `
      + `${DOCUMENT_REPORT_RETENTION_DAYS} days`,
    );
  },
};
