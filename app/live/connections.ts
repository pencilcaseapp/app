import type { Connection, Hocuspocus } from '@hocuspocus/server';
import type { RedisInstance } from '@hocuspocus/extension-redis';
import { LiveCloseReason, type LiveAccessMessage } from '~/constants/live';
import type { DocumentViewer } from '~/repos/document';
import type { LiveAccess } from '~/services/document';

const FORBIDDEN_CODE = 4403;
const REVOCATION_CHANNEL = 'pencil-case:live:revoke-access';

/**
 * Resolves what a viewer may do with a document right now — the same
 * answer `onConnect` gets, asked again for a connection that is already
 * open.
 */
export type ResolveLiveAccess = (
  documentId: string,
  viewer?: DocumentViewer,
) => Promise<LiveAccess | undefined>;

export interface LiveConnectionContext {
  userId?: string;
  viewer?: DocumentViewer;
}

type LiveConnection = Connection & { context: LiveConnectionContext };

const globalForLive = globalThis as typeof globalThis & {
  liveServer?: Hocuspocus;
  liveAccessResolver?: ResolveLiveAccess;
  liveRevocationPublisher?: RedisInstance;
};

export function registerLiveServer(
  instance: Hocuspocus,
  resolveAccess: ResolveLiveAccess,
) {
  globalForLive.liveServer = instance;
  globalForLive.liveAccessResolver = resolveAccess;
}

type ChannelMessage
  = ({ type?: 'close' } & CloseDocumentConnectionsInput)
    | ({ type: 'access' } & UpdateDocumentAccessInput);

/**
 * The connections of a document are spread over the whole fleet and a process
 * can only close its own, so a revocation has to reach the other instances
 * over Redis as well. The publisher closes its own connections right away
 * rather than waiting for its message to come back, which keeps the single
 * instance case synchronous; closing a connection twice is a no-op, and so
 * is applying an access the connection already has.
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

    const parsed: ChannelMessage = JSON.parse(message);

    if (parsed.type === 'access') {
      updateLocalAccess(parsed).catch(console.error);
      return;
    }

    closeLocalConnections(parsed);
  });
}

function publish(message: ChannelMessage) {
  globalForLive.liveRevocationPublisher?.publish(
    REVOCATION_CHANNEL,
    JSON.stringify(message),
  );
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
  /** Close only this user's connections, e.g. after their access changed. */
  userId?: string;
  /** Close everybody's connections but this user's. */
  keepUserId?: string;
}

export function closeDocumentConnections(
  input: CloseDocumentConnectionsInput,
) {
  closeLocalConnections(input);
  publish({ type: 'close', ...input });
}

export interface UpdateDocumentAccessInput {
  documentId: string;
  /** Update only this user's connections. */
  userId?: string;
  /** Update everybody's connections but this user's. */
  keepUserId?: string;
}

/**
 * Re-resolves the access of the open connections and switches them in
 * place: a connection is either closed, because its access is gone, or
 * told its new mode through a stateless message and stays connected, with
 * its awareness state — which is what keeps the presence avatars from
 * flickering.
 */
export async function updateDocumentAccess(input: UpdateDocumentAccessInput) {
  publish({ type: 'access', ...input });
  await updateLocalAccess(input);
}

function selectLocalConnections(input: UpdateDocumentAccessInput) {
  const { documentId, userId, keepUserId } = input;
  const document = globalForLive.liveServer?.documents.get(documentId);
  const connections = Array.from(
    document?.connections.keys() ?? [],
  ) as LiveConnection[];

  return connections.filter((connection) => {
    const connectionUserId = connection.context.userId;

    if (keepUserId && connectionUserId === keepUserId) {
      return false;
    }

    return !userId || connectionUserId === userId;
  });
}

function closeLocalConnections(input: CloseDocumentConnectionsInput) {
  selectLocalConnections(input).forEach(closeConnection);
}

function closeConnection(connection: Connection) {
  connection.close({
    code: FORBIDDEN_CODE,
    reason: LiveCloseReason.AccessRevoked,
  });
}

async function updateLocalAccess(input: UpdateDocumentAccessInput) {
  const resolveAccess = globalForLive.liveAccessResolver;

  if (!resolveAccess) {
    return;
  }

  await Promise.all(
    selectLocalConnections(input).map(async (connection) => {
      const access = await resolveAccess(
        input.documentId,
        connection.context.viewer,
      );

      if (!access) {
        closeConnection(connection);
        return;
      }

      if (connection.readOnly === access.readOnly) {
        return;
      }

      connection.readOnly = access.readOnly;
      connection.sendStateless(JSON.stringify({
        type: 'access',
        readOnly: access.readOnly,
      } satisfies LiveAccessMessage));
    }),
  );
}
