import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getConfig } from '~/config';
import { getJobsQueue } from './queue';

export const JOBS_BOARD_PATH = '/jobs-board';

/**
 * Bull Board, a debugging dashboard for the queue. Development only —
 * it has no auth of its own.
 */
export function createJobsBoard() {
  const config = getConfig();
  const queue = getJobsQueue();

  if (config.environment !== 'development' || !queue) {
    return undefined;
  }

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(JOBS_BOARD_PATH);

  createBullBoard({
    queues: [new BullMQAdapter(queue)],
    serverAdapter,
  });

  return serverAdapter.getRouter();
}
