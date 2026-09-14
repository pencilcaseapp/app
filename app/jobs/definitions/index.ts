import type { JobDefinition } from '../job';
import { cleanUpExpiredOtps } from './clean-up-expired-otps';
import { cleanUpExpiredSessions } from './clean-up-expired-sessions';
import { purgeDeletedDocuments } from './purge-deleted-documents';

export const jobDefinitions: JobDefinition[] = [
  cleanUpExpiredOtps,
  cleanUpExpiredSessions,
  purgeDeletedDocuments,
];
