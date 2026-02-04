import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(url?: string): Socket {
  if (socket) {
    return socket;
  }

  socket = io(url, {
    autoConnect: false,
  });

  return socket;
}
