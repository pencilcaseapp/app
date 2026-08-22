import type { JobDefinition } from '../job';
import { cleanUpExpiredOtps } from './clean-up-expired-otps';

export const jobDefinitions: JobDefinition[] = [
  cleanUpExpiredOtps,
];
