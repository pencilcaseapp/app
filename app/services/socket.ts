import { io, Socket } from 'socket.io-client';
import { getConfig } from '~/config';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  const config = getConfig();
  socket = io(config.socket.url, {
    autoConnect: false,
  });

  return socket;
}
