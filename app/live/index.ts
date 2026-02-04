import { Server } from 'socket.io';
import type { Server as NodeServer } from 'node:http';
import { getConfig } from '~/config';

export function createLiveServer(server: NodeServer) {
  const config = getConfig();

  const io = new Server(server, {
    cors: config.socket.enableCors
      ? {
          origin: '*',
        }
      : undefined,
  });

  io.on('connection', (socket) => {
    console.log('connected to live server', socket.id);

    socket.on('disconnect', function () {
      console.log('disconnected from live server', socket.id);
    });
  });

  return io;
}
