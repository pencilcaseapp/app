import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  socket = io(process.env.NODE_ENV === 'production' ? 'http://localhost:3000' : 'http://localhost:3003', {
    autoConnect: false,
  });

  return socket;
}
