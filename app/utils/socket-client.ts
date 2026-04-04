import { HocuspocusProviderWebsocket } from '@hocuspocus/provider';

let socketClient: HocuspocusProviderWebsocket | null = null;

export function getSocketClient(): HocuspocusProviderWebsocket {
  if (!socketClient) {
    socketClient = new HocuspocusProviderWebsocket({
      url: '/live',
    });
  }

  return socketClient;
}
