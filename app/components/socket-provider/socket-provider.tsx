import { useEffect, useMemo, type PropsWithChildren } from 'react';
import { ContextSocket } from '~/contexts/socket';
import { getSocket } from '~/services/socket';

export const SocketProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  });

  return <ContextSocket.Provider value={socket}>{children}</ContextSocket.Provider>;
};
