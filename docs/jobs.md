# Background jobs

Scheduled work runs through [BullMQ](https://docs.bullmq.io/) in `app/jobs/`.
Every app instance starts a worker next to the web server (`startJobs()` in
`server.ts`), so there is no separate worker process to deploy — the queue
makes sure each due job runs once, on whichever instance picks it up first.

## Defining a job

A job is a plain object (`JobDefinition` in `app/jobs/job.ts`): a unique
name, a cron schedule and a `run` function. Drop it in
`app/jobs/definitions/` and register it in `app/jobs/definitions/index.ts`:

```ts
export const cleanUpExpiredOtps: JobDefinition = {
  name: 'clean-up-expired-otps',
  schedule: '0 4 * * *', // cron, evaluated in UTC
  run: async () => {
    // calls services/repos like a loader would
  },
};
```

That is the whole pattern. On boot `startJobs()` upserts a BullMQ job
scheduler per definition (idempotent, so every instance doing it is fine),
removes schedulers whose definition no longer exists, and starts the worker
that dispatches each job to its `run` by name.

## On-demand jobs

Work a service hands off rather than runs on a schedule (an e-mail that
should be retried when the provider is down, say) is an
`OnDemandJobDefinition`: a name and a `run` that takes the job's data. Add
the name and the shape of its data to `OnDemandJobs` in `app/jobs/job.ts`,
register the definition in `onDemandJobDefinitions` and queue it with
`enqueueJob(name, data)` from `app/jobs/queue.ts`. The data goes through
Redis, so keep it JSON (a date travels as an ISO string). Without a jobs
Redis `enqueueJob` runs nothing; tests call `run` directly.

## Failure handling

The queue's default job options (`app/jobs/queue.ts`) give every run three
attempts with exponential backoff starting at 30 seconds. A run that fails
all three stays visible as a failed job (the last 1000 are kept) and is
logged by the worker; the next scheduled run happens regardless.

On-demand jobs get ten attempts (`ON_DEMAND_JOB_ATTEMPTS`) on the same
backoff, which keeps retrying for a little over four hours. They send
e-mails, and a send has to outlast an outage of the mail provider rather
than give up after a minute and a half.

Keep `run` idempotent: a retry after a half-finished run must be safe.

## Redis

The queue lives on the same Redis server as the live-collaboration fan-out
but under its own config (`config.jobs.redis`) and its own key prefix
(`pencil-case:jobs:*` next to `pencil-case:live:*`). Production reads the
same `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`/`REDIS_TLS` variables;
splitting jobs onto their own Redis later is a config change, not a code
change.

Like the live server, jobs are off when the config leaves `redis` out —
that is the test environment, where vitest calls `run` functions directly
instead of going through a queue.

BullMQ needs real Redis semantics (streams, `EVAL`); the caveats about
Redis-compatible stores in `docs/scaling.md` apply here too.

## Debugging locally

In development the server mounts [Bull Board](https://github.com/felixmosh/bull-board)
on <http://localhost:3000/dev/bullmq>: inspect scheduled/completed/failed
runs, retry a failed one, or trigger a scheduled job right away. It is not
mounted outside development.
