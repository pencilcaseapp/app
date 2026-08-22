import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { getConfig } from '~/config';

export const JOBS_QUEUE_NAME = 'jobs';

/** Keeps the queue keys legible next to `pencil-case:live`. */
export const JOBS_PREFIX = 'pencil-case';

const MAX_RECONNECT_DELAY = 2_000;

let queue: Queue | undefined;

/**
 * Same retry posture as the live server's Redis clients: queue commands
 * until Redis is back instead of failing them. `maxRetriesPerRequest: null`
 * is also what BullMQ requires for its blocking worker connection.
 */
export function createJobsConnection(): ConnectionOptions | undefined {
  const { jobs } = getConfig();

  if (!jobs.redis) {
    return undefined;
  }

  return {
    host: jobs.redis.host,
    port: jobs.redis.port,
    password: jobs.redis.password,
    tls: jobs.redis.tls ? {} : undefined,
    maxRetriesPerRequest: null,
    retryStrategy: (attempt: number) =>
      Math.min(attempt * 200, MAX_RECONNECT_DELAY),
  };
}

/** Returns nothing when the environment runs without background jobs. */
export function getJobsQueue() {
  const connection = createJobsConnection();

  if (!connection) {
    return undefined;
  }

  queue ??= new Queue(JOBS_QUEUE_NAME, {
    prefix: JOBS_PREFIX,
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30_000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    },
  });

  return queue;
}

export async function closeJobsQueue() {
  await queue?.close();
  queue = undefined;
}
