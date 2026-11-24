import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { getConfig } from '~/config';
import type { OnDemandJobName, OnDemandJobs } from './job';

export const JOBS_QUEUE_NAME = 'jobs';

/** Keeps the queue keys legible next to `pencil-case:live`. */
export const JOBS_PREFIX = 'pencil-case';

const MAX_RECONNECT_DELAY = 2_000;

/**
 * The on-demand jobs send e-mails, which have to outlast an outage of the
 * mail provider: with the queue's exponential backoff from 30 seconds,
 * ten attempts keep trying for a little over four hours.
 */
const ON_DEMAND_JOB_ATTEMPTS = 10;

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

/**
 * Hands a job to the worker, which retries it with the queue's backoff
 * (`ON_DEMAND_JOB_ATTEMPTS` times).
 * Best effort: a job that cannot be queued is logged, never thrown, so
 * the work that queued it stands. Without a jobs Redis (the test
 * environment) nothing runs: tests call the definition's `run` directly.
 */
export async function enqueueJob<Name extends OnDemandJobName>(
  name: Name,
  data: OnDemandJobs[Name],
) {
  const queue = getJobsQueue();

  if (!queue) {
    console.warn(`Jobs are off, not running ${name} …`);
    return;
  }

  try {
    await queue.add(name, data, { attempts: ON_DEMAND_JOB_ATTEMPTS });
  }
  catch (error) {
    console.error(`Queueing ${name} failed`, error);
  }
}

export async function closeJobsQueue() {
  await queue?.close();
  queue = undefined;
}
