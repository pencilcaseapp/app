/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Hocuspocus,
  type Extension,
  type WebSocketLike,
} from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { getDocument, updateDocument } from '~/repos/document';
import { canOpenDocument } from '~/services/document';
import { getAuthUserByCookie } from '~/services/auth';
import {
  ForbiddenError,
  registerLiveServer,
  registerRevocationChannel,
} from './connections';
import { createRedisExtension } from './redis';
import { extractTitleFromYDoc } from '~/utils/yjs';
import { createInitialDocumentContent } from '~/utils/headless';
import { getConfig } from '~/config';
import crossws from 'crossws/adapters/node';
import { setTimeout as delay } from 'node:timers/promises';
import type { Server } from 'node:http';

const SHUTDOWN_TIMEOUT = 10_000;

const config = getConfig();
const extensions: Extension[] = [];
const redis = createRedisExtension();

if (redis) {
  extensions.push(redis);
  registerRevocationChannel(redis.pub.duplicate(), redis.pub.duplicate());
}

extensions.push(new Database({
  fetch: async ({ documentName }) => {
    const document = await getDocument(documentName);
    const content = document?.content ?? createInitialDocumentContent();
    return content;
  },
  store: async ({ documentName, state, document }) => {
    const title = extractTitleFromYDoc(document);
    await updateDocument(documentName, { content: state, title });
  },
}));

const hocuspocus = new Hocuspocus({
  name: config.instanceId,
  onConnect: async ({ documentName, requestHeaders }) => {
    const user = await getAuthUserByCookie(requestHeaders.get('cookie'));

    if (!await canOpenDocument(documentName, user?.id)) {
      throw new ForbiddenError();
    }

    return { userId: user?.id };
  },
  extensions,
});

registerLiveServer(hocuspocus);

export const ws = crossws({
  hooks: {
    open(peer) {
      const clientConnection = hocuspocus.handleConnection(
        peer.websocket as unknown as WebSocketLike,
        peer.request,
      )
      ;(peer as any)._hocuspocus = clientConnection;
    },
    message(peer, message) {
      ;(peer as any)._hocuspocus?.handleMessage(message.uint8Array());
    },
    close(peer, event) {
      ;(peer as any)._hocuspocus?.handleClose({
        code: event.code,
        reason: event.reason,
      });
    },
    error(peer, error) {
      console.error('WebSocket error for peer:', peer.id);
      console.error(error);
    },
  },
});

export function createLiveServer(server: Server) {
  server.on('upgrade', (request, socket, head) => {
    ws.handleUpgrade(request, socket, head);
  });
}

/**
 * A deployment replaces the instances, so the documents only this process has
 * in memory have to reach the database before it exits. Closing the
 * connections sends the clients to another instance and flushing runs the
 * writes the Database extension is still holding behind its debounce, which
 * is what a plain `SIGTERM` would otherwise drop.
 */
export async function stopLiveServer() {
  await Promise.race([unloadDocuments(), delay(SHUTDOWN_TIMEOUT)]);
  await hocuspocus.hooks('onDestroy', { instance: hocuspocus });
}

function unloadDocuments() {
  return new Promise<void>((resolve) => {
    const resolveWhenEmpty = () => {
      if (hocuspocus.getDocumentsCount() === 0) {
        resolve();
      }
    };

    hocuspocus.configuration.extensions.push({
      afterUnloadDocument: async () => resolveWhenEmpty(),
    });

    hocuspocus.closeConnections();
    hocuspocus.flushPendingStores();
    resolveWhenEmpty();
  });
}
