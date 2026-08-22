import { Worker } from 'bullmq';
import { jobDefinitions } from './definitions';
import {
  closeJobsQueue,
  createJobsConnection,
  getJobsQueue,
  JOBS_PREFIX,
  JOBS_QUEUE_NAME,
} from './queue';

let worker: Worker | undefined;

/**
 * Puts every definition on its schedule and starts the worker that runs
 * them, or does nothing when the environment has no jobs Redis (the test
 * environment). Upserting the schedulers is idempotent, so every instance
 * doing it on boot is fine — BullMQ still runs each due job once, on
 * whichever worker picks it up.
 */
export async function startJobs() {
  const queue = getJobsQueue();
  const connection = createJobsConnection();

  if (!queue || !connection) {
    return;
  }

  for (const definition of jobDefinitions) {
    await queue.upsertJobScheduler(
      definition.name,
      { pattern: definition.schedule },
      { name: definition.name },
    );
  }

  // A deleted definition would otherwise keep its schedule in Redis forever.
  const schedulers = await queue.getJobSchedulers();

  for (const scheduler of schedulers) {
    if (!jobDefinitions.some(definition => definition.name === scheduler.key)) {
      await queue.removeJobScheduler(scheduler.key);
    }
  }

  worker = new Worker(
    JOBS_QUEUE_NAME,
    async (job) => {
      const definition = jobDefinitions.find(({ name }) => name === job.name);

      if (!definition) {
        throw new Error(`Unknown job: ${job.name}`);
      }

      await definition.run();
    },
    { prefix: JOBS_PREFIX, connection },
  );

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.name} failed:`, error);
  });

  worker.on('error', (error) => {
    console.error('Jobs Redis connection error:', error.message);
  });
}

/**
 * `Worker.close()` waits for the job it is currently running, so a
 * deployment does not kill a half-finished run.
 */
export async function stopJobs() {
  await worker?.close();
  worker = undefined;
  await closeJobsQueue();
}
