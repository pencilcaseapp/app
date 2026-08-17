import type { Hocuspocus } from '@hocuspocus/server';
import { LiveCloseReason } from '~/constants/live';

const FORBIDDEN_CODE = 4403;

const globalForLive = globalThis as typeof globalThis & {
  liveServer?: Hocuspocus;
};

export function registerLiveServer(instance: Hocuspocus) {
  globalForLive.liveServer = instance;
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
