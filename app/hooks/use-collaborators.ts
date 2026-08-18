import { useEffect, useState } from 'react';
import type {
  HocuspocusProvider,
  onAwarenessChangeParameters,
} from '@hocuspocus/provider';
import { getRemoteCollaborators, type Collaborator } from '~/utils/presence';

/**
 * The other people currently in the document. The Hocuspocus server broadcasts
 * awareness whenever somebody joins, and drops the state of a connection when
 * it goes away, so this list follows joining and leaving on its own.
 */
export function useCollaborators(
  provider: HocuspocusProvider,
): Collaborator[] {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    const handleAwarenessChange = ({ states }: onAwarenessChangeParameters) => {
      setCollaborators(
        getRemoteCollaborators(states, provider.document.clientID),
      );
    };

    provider.on('awarenessChange', handleAwarenessChange);

    return () => {
      provider.off('awarenessChange', handleAwarenessChange);
    };
  }, [provider]);

  return collaborators;
}
