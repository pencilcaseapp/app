import { Hocuspocus } from '@hocuspocus/server';
import type { Application } from 'express-ws';
import { Database } from '@hocuspocus/extension-database';
import { getDocument, updateDocument } from '~/repos/document';
import { extractTitleFromYDoc } from '~/utils/yjs';

const hocuspocus = new Hocuspocus({
  name: 'hocuspocus-01',
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        const document = await getDocument(documentName);
        return document?.content ?? null;
      },
      store: async ({ documentName, state, document }) => {
        const title = extractTitleFromYDoc(document);
        await updateDocument(documentName, { content: state, title });
      },
    }),
  ],
});

export function createLiveServer(app: Application) {
  app.ws('/live', (websocket, request) => {
    hocuspocus.handleConnection(websocket, request);
  });
}
