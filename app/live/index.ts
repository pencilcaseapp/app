/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hocuspocus, type WebSocketLike } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { getDocument, updateDocument } from '~/repos/document';
import { canOpenDocument } from '~/services/document';
import { getAuthUserByCookie } from '~/services/auth';
import { ForbiddenError, registerLiveServer } from './connections';
import { extractTitleFromYDoc } from '~/utils/yjs';
import { createInitialDocumentContent } from '~/utils/headless';
import crossws from 'crossws/adapters/node';
import type { Server } from 'node:http';

const hocuspocus = new Hocuspocus({
  name: 'hocuspocus-01',
  onConnect: async ({ documentName, requestHeaders }) => {
    const user = await getAuthUserByCookie(requestHeaders.get('cookie'));

    if (!await canOpenDocument(documentName, user?.id)) {
      throw new ForbiddenError();
    }

    return { userId: user?.id };
  },
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        const document = await getDocument(documentName);
        const content = document?.content ?? createInitialDocumentContent();
        return content;
      },
      store: async ({ documentName, state, document }) => {
        const title = extractTitleFromYDoc(document);
        await updateDocument(documentName, { content: state, title });
      },
    }),
  ],
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
