import type { JobDefinition } from '../job';
import { cleanUpExpiredEmailChangeRequests } from './clean-up-expired-email-change-requests';
import { cleanUpOldCreemWebhookEvents } from './clean-up-old-creem-webhook-events';
import { cleanUpExpiredOtps } from './clean-up-expired-otps';
import { cleanUpExpiredSessions } from './clean-up-expired-sessions';
import { cleanUpOldDocumentReports } from './clean-up-old-document-reports';
import { cleanUpOldEmailLogs } from './clean-up-old-email-logs';
import { purgeDeletedDocuments } from './purge-deleted-documents';

export const jobDefinitions: JobDefinition[] = [
  cleanUpExpiredOtps,
  cleanUpExpiredEmailChangeRequests,
  cleanUpExpiredSessions,
  cleanUpOldEmailLogs,
  cleanUpOldCreemWebhookEvents,
  cleanUpOldDocumentReports,
  purgeDeletedDocuments,
];
