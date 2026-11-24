import type { QueuedEmail } from '~/services/email-templates';

/**
 * A background job is a plain object: give it a unique name, a cron
 * schedule and a `run` function, then register it in `./definitions`.
 * The worker in `./index.ts` picks it up from there — nothing else to wire.
 */
export interface JobDefinition {
  /** Unique — names the BullMQ job and its scheduler. */
  name: string;

  /** Cron pattern, evaluated in UTC. */
  schedule: string;

  run: () => Promise<void>;
}

/**
 * The jobs a service hands off with `enqueueJob` instead of on a schedule,
 * by name, with the data each one takes. Keep the data JSON: it goes
 * through Redis.
 */
export interface OnDemandJobs {
  'send-account-deleted-email': { userId: string; deletedAt: string };
  'send-email': QueuedEmail;
}

export type OnDemandJobName = keyof OnDemandJobs;

/** Registered in `./definitions` next to the scheduled ones. */
export interface OnDemandJobDefinition<Name extends OnDemandJobName> {
  name: Name;
  run: (data: OnDemandJobs[Name]) => Promise<void>;
}
