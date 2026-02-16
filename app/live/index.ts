import type { Server as NodeServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from './utils';

export function createLiveServer(server: NodeServer) {
  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', setupWSConnection);

  server.on('upgrade', (request, socket, head) => {
  // You may check auth of request here..
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  return wss;
}
