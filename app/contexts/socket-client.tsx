import type { HocuspocusProviderWebsocket } from '@hocuspocus/provider';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { getSocketClient } from '~/utils/socket-client';

export const SocketClientContext = createContext<
HocuspocusProviderWebsocket | null
>(
  null,
);

export function useSocketClient() {
  const context = useContext(SocketClientContext);

  if (!context) {
    throw new Error('useSocketClient must be used within a SocketClientProvider');
  }

  return context;
}

export const SocketClientProvider: React.FC<PropsWithChildren>
  = ({ children }) => {
    const socketClient = getSocketClient();

    return (
      <SocketClientContext.Provider value={socketClient}>
        {children}
      </SocketClientContext.Provider>
    );
  };
