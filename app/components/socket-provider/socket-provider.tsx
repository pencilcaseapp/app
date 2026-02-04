import { useEffect, useMemo, type PropsWithChildren } from 'react';
import { ContextSocket } from '~/contexts/socket';
import { getSocket } from '~/services/socket';

export interface SocketProviderProps {
  url?: string;
}

export const SocketProvider: React.FC<PropsWithChildren<SocketProviderProps>> = ({ children, url }) => {
  const socket = useMemo(() => getSocket(url), [url]);

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  });

  return <ContextSocket.Provider value={socket}>{children}</ContextSocket.Provider>;
};
