import { useEffect } from 'react';
import type {
  HocuspocusProvider,
  onStatelessParameters,
} from '@hocuspocus/provider';
import type { LiveAccessMessage } from '~/constants/live';

function parseAccessMessage(payload: string): LiveAccessMessage | undefined {
  try {
    const message = JSON.parse(payload);

    if (message?.type === 'access' && typeof message.readOnly === 'boolean') {
      return message;
    }
  }
  catch {
    // Not ours.
  }

  return undefined;
}

/**
 * Reports a change of access the server applied to the open connection. An
 * edit the server received after it went read-only is dropped there but
 * stays in the local document, so when one is still unconfirmed the switch
 * is reported as `stale` — the editor then reconnects for a fresh copy,
 * as it does when access is revoked.
 */
export function useLiveAccess(
  provider: HocuspocusProvider,
  onAccessChanged?: (access: { readOnly: boolean; stale: boolean }) => void,
) {
  useEffect(() => {
    const handleStateless = ({ payload }: onStatelessParameters) => {
      const message = parseAccessMessage(payload);

      if (!message) {
        return;
      }

      onAccessChanged?.({
        readOnly: message.readOnly,
        stale: message.readOnly && provider.hasUnsyncedChanges,
      });
    };

    provider.on('stateless', handleStateless);

    return () => {
      provider.off('stateless', handleStateless);
    };
  }, [provider, onAccessChanged]);
}
