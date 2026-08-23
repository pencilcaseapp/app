import type { JobDefinition } from '../job';
import { cleanUpExpiredOtps } from './clean-up-expired-otps';
import { cleanUpExpiredSessions } from './clean-up-expired-sessions';

export const jobDefinitions: JobDefinition[] = [
  cleanUpExpiredOtps,
  cleanUpExpiredSessions,
];
