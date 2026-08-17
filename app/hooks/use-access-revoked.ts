import { useEffect } from 'react';
import type {
  HocuspocusProvider,
  onCloseParameters,
} from '@hocuspocus/provider';
import { LiveCloseReason } from '~/constants/live';

export function useAccessRevoked(
  provider: HocuspocusProvider,
  onAccessRevoked?: () => void,
) {
  useEffect(() => {
    const handleClose = ({ event }: onCloseParameters) => {
      if (event?.reason !== LiveCloseReason.AccessRevoked) {
        return;
      }

      onAccessRevoked?.();
    };

    const handleAuthenticationFailed = () => onAccessRevoked?.();

    provider.on('close', handleClose);
    provider.on('authenticationFailed', handleAuthenticationFailed);

    return () => {
      provider.off('close', handleClose);
      provider.off('authenticationFailed', handleAuthenticationFailed);
    };
  }, [provider, onAccessRevoked]);
}
