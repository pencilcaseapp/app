import { useEffect } from 'react';
import type {
  HocuspocusProvider,
  onCloseParameters,
} from '@hocuspocus/provider';
import { LiveCloseReason } from '~/constants/live';

/**
 * Reports a document connection the server closed or refused, and lets go
 * of the provider without the close message `detach` would send for it:
 * the socket is shared by every open document and keyed by document name,
 * and the server queues a close for a connection it no longer has as the
 * first message of the next connection to that document — which would
 * close the reconnect right after it was set up.
 */
export function useAccessRevoked(
  provider: HocuspocusProvider,
  onAccessRevoked?: () => void,
) {
  useEffect(() => {
    const forgetProvider = () => {
      provider.configuration.websocketProvider.configuration.providerMap
        .delete(provider.effectiveName);
      provider.detach();
    };

    const handleClose = ({ event }: onCloseParameters) => {
      if (event?.reason !== LiveCloseReason.AccessRevoked) {
        return;
      }

      forgetProvider();
      onAccessRevoked?.();
    };

    const handleAuthenticationFailed = () => {
      forgetProvider();
      onAccessRevoked?.();
    };

    provider.on('close', handleClose);
    provider.on('authenticationFailed', handleAuthenticationFailed);

    return () => {
      provider.off('close', handleClose);
      provider.off('authenticationFailed', handleAuthenticationFailed);
    };
  }, [provider, onAccessRevoked]);
}
