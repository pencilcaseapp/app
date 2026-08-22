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
