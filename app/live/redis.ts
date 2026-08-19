import { Redis } from '@hocuspocus/extension-redis';
import { getConfig } from '~/config';

const MAX_RECONNECT_DELAY = 2_000;

/**
 * Connects this instance to the rest of the fleet, or returns nothing when
 * the environment runs a single live server and needs no fan-out.
 *
 * The extension holds its connections for the lifetime of the process and
 * uses them to keep the instances in sync, so a command is never worth giving
 * up on: `maxRetriesPerRequest: null` queues them until Redis is back instead
 * of failing them after the twenty attempts ioredis defaults to, which would
 * leave this instance silently out of step with the others.
 */
export function createRedisExtension() {
  const { live, instanceId } = getConfig();

  if (!live.redis) {
    return undefined;
  }

  const extension = new Redis({
    identifier: instanceId,
    prefix: 'pencil-case:live',
    host: live.redis.host,
    port: live.redis.port,
    options: {
      password: live.redis.password,
      tls: live.redis.tls ? {} : undefined,
      maxRetriesPerRequest: null,
      retryStrategy: (attempt: number) =>
        Math.min(attempt * 200, MAX_RECONNECT_DELAY),
    },
  });

  extension.pub.on('error', logConnectionError);
  extension.sub.on('error', logConnectionError);

  return extension;
}

function logConnectionError(error: Error) {
  console.error('Redis connection error:', error.message);
}
