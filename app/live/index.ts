import { Hocuspocus } from '@hocuspocus/server';
import type { Application } from 'express-ws';

const hocuspocus = new Hocuspocus({
  name: 'hocuspocus-01',
});

export function createLiveServer(app: Application) {
  app.ws('/live', (websocket, request) => {
    hocuspocus.handleConnection(websocket, request);
  });
}
