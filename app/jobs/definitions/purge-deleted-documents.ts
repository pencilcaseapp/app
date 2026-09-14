import type { JobDefinition } from '../job';
import { DELETED_DOCUMENT_RETENTION_DAYS } from '~/constants/document';
import { purgeDocumentsDeletedBefore } from '~/repos/document';

const RETENTION = DELETED_DOCUMENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Makes good on what the delete dialog promises: a document stays in
 * Deleted for the retention period and is then gone for good.
 */
export const purgeDeletedDocuments: JobDefinition = {
  name: 'purge-deleted-documents',
  schedule: '0 4 * * *',
  run: async () => {
    const before = new Date(Date.now() - RETENTION);
    const deletedCount = await purgeDocumentsDeletedBefore(before);

    console.log(`🧹 Purged ${deletedCount} deleted documents`);
  },
};
