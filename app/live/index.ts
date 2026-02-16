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
    const { docId, userName } = socket.handshake.auth;
    socket.data.userName = userName;

    if (docId) {
      socket.join(docId);
      emitUsers(docId, io);
    }

    socket.on('disconnect', function () {
      if (docId) {
        emitUsers(docId, io);
      }
    });
  });

  return io;
}

async function emitUsers(docId: string, io: Server) {
  const sockets = await io.in(docId).fetchSockets();
  const users = sockets.map(s => ({ id: s.id, userName: s.data.userName }));

  io.to(docId).emit('users.updated', users);
}
