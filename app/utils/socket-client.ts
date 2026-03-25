import { HocuspocusProviderWebsocket } from '@hocuspocus/provider';

let socketClient: HocuspocusProviderWebsocket | null = null;

export function getSocketClient(wsUrl: string): HocuspocusProviderWebsocket {
  if (!socketClient) {
    socketClient = new HocuspocusProviderWebsocket({
      url: wsUrl,
    });
  }

  return socketClient;
}
