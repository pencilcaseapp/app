import type { JobDefinition, OnDemandJobDefinition, OnDemandJobName } from '../job';
import { cleanUpExpiredEmailChangeRequests } from './clean-up-expired-email-change-requests';
import { cleanUpOldCreemWebhookEvents } from './clean-up-old-creem-webhook-events';
import { cleanUpExpiredOtps } from './clean-up-expired-otps';
import { cleanUpExpiredSessions } from './clean-up-expired-sessions';
import { cleanUpOldDocumentReports } from './clean-up-old-document-reports';
import { cleanUpOldEmailLogs } from './clean-up-old-email-logs';
import { purgeDeletedAccounts } from './purge-deleted-accounts';
import { purgeDeletedDocuments } from './purge-deleted-documents';
import { sendAccountDeletedEmail } from './send-account-deleted-email';
import { sendEmail } from './send-email';

export const jobDefinitions: JobDefinition[] = [
  cleanUpExpiredOtps,
  cleanUpExpiredEmailChangeRequests,
  cleanUpExpiredSessions,
  cleanUpOldEmailLogs,
  cleanUpOldCreemWebhookEvents,
  cleanUpOldDocumentReports,
  purgeDeletedDocuments,
  purgeDeletedAccounts,
];

export const onDemandJobDefinitions: {
  [Name in OnDemandJobName]: OnDemandJobDefinition<Name>;
} = {
  'send-account-deleted-email': sendAccountDeletedEmail,
  'send-email': sendEmail,
};
