# Scaling the live server

Collaborative editing keeps state in memory: a Y.Doc lives in the process that
loaded it, and the WebSocket connections editing it are held by that same
process. One instance is therefore the simple case and every instance after it
needs the fleet to behave as if it were still one — which is what
[`@hocuspocus/extension-redis`](https://tiptap.dev/docs/hocuspocus/server/extensions/redis)
does.

## What Redis does and does not do

The extension is a **transport, not a store**. Every instance subscribes to a
Redis channel per open document and publishes its Yjs updates and awareness
changes there, so two people editing the same document from two instances
converge and see each other's cursors. It keeps no document data: persistence
stays with the `Database` extension writing `documents.content` in Postgres,
and nothing in Redis survives a restart.

Three parts matter for us:

- **Update and awareness fan-out.** Instance A's changes reach instance B's
  clients. Presence works across instances for the same reason.
- **Initial sync.** When a document is opened on an instance that does not have
  it, the extension asks the channel first and waits up to
  `awaitInitialSyncTimeout` (1s by default) for a peer to answer with its
  in-memory state. Without it a second instance would load the last *persisted*
  state and lose everything typed since the last write.
- **A store lock.** `onStoreDocument` takes a Redlock before the `Database`
  extension writes, so two instances holding the same document do not race each
  other into Postgres.

What it does **not** do is propagate connection closes. Unsharing a document has
to reach every instance holding a connection to it, so `app/live/connections.ts`
publishes revocations on its own channel (`pencil-case:live:revoke-access`) and
each instance closes the connections it owns. The publisher also closes its own
right away rather than waiting for its message to come back, which keeps the
single instance case synchronous; `Connection.close()` removes the connection
from the document, so handling the echo of our own message is a no-op.

## Configuration

`app/config/` owns the settings, as usual:

```ts
redis?: {
  host: string;
  port: number;
  password?: string;
  tls: boolean;
};
```

It is optional, and leaving it out is what runs the live server on its own —
that is the test environment, which has no fan-out to test and no Redis
container to boot in CI. Development points at the `redis_dev` container from
`docker-compose.yml`; production reads `REDIS_HOST`, `REDIS_PORT`,
`REDIS_PASSWORD` and `REDIS_TLS` and refuses to boot without the first two,
because an instance that silently comes up without Redis is an instance whose
users lose each other's edits.

`app/config/instance.ts` gives the process an identity. The extension tags every
message with it to filter its own back out, so two instances sharing one is the
one way to break the fan-out. Clever Cloud sets `INSTANCE_ID` on every scaler;
locally the pid stands in.

## Local development

`npm run docker:up` starts Redis on `6379` next to the two Postgres
containers. Nothing else is needed — a single dev server behaves the same with
it or without it. To actually exercise the fan-out, run a second server on
another port against the same containers and open the same document in two
browsers.

## Clever Cloud

Add the **Redis** add-on and link it to the app. It injects `REDIS_HOST`,
`REDIS_PORT` and `REDIS_PASSWORD`, which is exactly what the production config
reads, so there is nothing to map by hand:

```bash
clever addon create redis-addon pencil-case-redis --plan s_mono
clever service link-addon pencil-case-redis -a pencil-case-app-prod
```

> **Not Materia KV.** Its Redis compatibility layer is missing Pub/Sub,
> keyspace notifications and `EVAL`, which are the three things this extension
> is built on — it publishes on a channel per document and takes its store
> lock with Redlock. The trap is that Materia KV *also* exposes `REDIS_HOST`,
> `REDIS_PORT` and `REDIS_PASSWORD` (as aliases of `KV_HOST` and friends), so
> the app would connect happily and then silently never sync. Use it for caching
> if we ever want it, not for this.

Once the add-on is linked, scaling out is a console (or `clever scale`) change.

### Sticky sessions: not needed, leave them off

Clever Cloud can pin a user to one scaler, and it is the usual reflex for
WebSockets, but nothing here wants it:

- A WebSocket is one long-lived connection. There is no second request to route
  to the same place, and the upgrade request carries the session cookie like any
  other.
- Sessions are a hashed token in the `sessions` table, so any instance can
  authenticate any request.
- Document state is shared through Redis, so it does not matter which instance a
  client lands on.

Stickiness would not even be a *substitute* for Redis: it pins a user, not a
document, so two people editing the same document would still be split across
instances. It only makes the fleet load worse — every client pinned to an
instance reconnects to the same replacement when it goes away — so leave
`sticky-sessions` disabled.

## Deployments

Clever Cloud keeps the old scalers running until the new ones are healthy and
then stops the old ones with `SIGTERM`. Two things carry a session across that:

- **The server drains on `SIGTERM`** (`stopLiveServer` in `app/live/index.ts`).
  It closes the connections so clients reconnect to a new instance, then calls
  `flushPendingStores()` to run the writes the `Database` extension is holding
  behind its debounce. Without it a deployment drops up to `maxDebounce` (10s)
  of edits on every document the instance had open.
- **Redis covers the overlap.** A client that reconnects to a new instance while
  the old one is still draining gets the old instance's in-memory state through
  the initial sync, not the last row in Postgres.

The drain is bounded by `SHUTDOWN_TIMEOUT` so a stuck document cannot hold the
process open until the platform kills it outright.

## Operational notes

- **Redis is a single point of failure for collaboration.** If it goes down,
  each instance keeps serving the documents it holds and persistence carries on
  — clients on different instances stop seeing each other. The clients queue
  commands until it is back (`maxRetriesPerRequest: null`) rather than failing
  them, which is the safer half of a bad trade: a dropped command is an instance
  that is silently out of step.
- **Watch connection count.** Each instance opens four connections: the
  extension's publisher and subscriber, plus the two the revocation channel
  duplicates off the publisher. Multiply by the number of scalers when picking
  an add-on plan.
- **Keep the prefix.** Keys are namespaced under `pencil-case:live`, so a Redis
  shared with anything else stays legible.
