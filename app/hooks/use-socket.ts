import { useContext } from 'react';
import { ContextSocket } from '~/contexts/socket';

export function useSocket() {
  const socket = useContext(ContextSocket);

  if (!socket) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return socket;
}
