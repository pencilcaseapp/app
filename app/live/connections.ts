import type { Hocuspocus } from '@hocuspocus/server';
import type { RedisInstance } from '@hocuspocus/extension-redis';
import { LiveCloseReason } from '~/constants/live';

const FORBIDDEN_CODE = 4403;
const REVOCATION_CHANNEL = 'pencil-case:live:revoke-access';

const globalForLive = globalThis as typeof globalThis & {
  liveServer?: Hocuspocus;
  liveRevocationPublisher?: RedisInstance;
};

export function registerLiveServer(instance: Hocuspocus) {
  globalForLive.liveServer = instance;
}

/**
 * The connections of a document are spread over the whole fleet and a process
 * can only close its own, so a revocation has to reach the other instances
 * over Redis as well. The publisher closes its own connections right away
 * rather than waiting for its message to come back, which keeps the single
 * instance case synchronous; closing a connection twice is a no-op.
 */
export function registerRevocationChannel(
  publisher: RedisInstance,
  subscriber: RedisInstance,
) {
  globalForLive.liveRevocationPublisher = publisher;

  subscriber.subscribe(REVOCATION_CHANNEL);
  subscriber.on('message', (channel, message) => {
    if (channel !== REVOCATION_CHANNEL) {
      return;
    }

    closeLocalConnections(JSON.parse(message));
  });
}

export class ForbiddenError extends Error {
  readonly code = FORBIDDEN_CODE;
  readonly reason = 'Forbidden';

  constructor() {
    super('Forbidden');
  }
}

export interface CloseDocumentConnectionsInput {
  documentId: string;
  keepUserId?: string;
}

export function closeDocumentConnections(
  input: CloseDocumentConnectionsInput,
) {
  closeLocalConnections(input);

  globalForLive.liveRevocationPublisher?.publish(
    REVOCATION_CHANNEL,
    JSON.stringify(input),
  );
}

function closeLocalConnections(input: CloseDocumentConnectionsInput) {
  const { documentId, keepUserId } = input;
  const document = globalForLive.liveServer?.documents.get(documentId);

  document?.connections.forEach((_clients, connection) => {
    if (keepUserId && connection.context.userId === keepUserId) {
      return;
    }

    connection.close({
      code: FORBIDDEN_CODE,
      reason: LiveCloseReason.AccessRevoked,
    });
  });
}
