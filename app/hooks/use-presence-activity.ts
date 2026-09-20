import { useEffect, useState } from 'react';
import { useIdle } from 'react-use';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import { PRESENCE_IDLE_TIMEOUT_MS } from '~/constants/presence';
import type { PresenceAwarenessData } from '~/utils/presence';

/**
 * Whether the page is the one in front of the person, rather than a tab
 * sitting behind the one they are reading.
 */
function useIsPageVisible(): boolean {
  const [isVisible, setIsVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const listener = () => setIsVisible(!document.hidden);

    document.addEventListener('visibilitychange', listener);

    return () => document.removeEventListener('visibilitychange', listener);
  }, []);

  return isVisible;
}

/**
 * Publishes whether this connection's person is really on the document, so
 * the avatars stand for somebody who is there rather than for an open socket:
 * a tab left open in the background holds its connection for as long as the
 * browser lets it, and used to keep its owner in everybody else's list.
 *
 * Being active is the page being visible and having been touched within
 * `PRESENCE_IDLE_TIMEOUT_MS` — hiding the tab is answered at once, going
 * quiet in front of it after the timeout.
 *
 * It rides along in `awarenessData` because that is the one field Lexical
 * carries through the awareness updates it makes for its cursors. Lexical
 * writes the object it was handed as a prop, so this mutates that same object
 * rather than replacing it: a new one would be dropped on the next keystroke,
 * and the prop has to keep its identity anyway. `setAwarenessField` is what
 * broadcasts the change in between Lexical's own updates.
 */
export function usePresenceActivity(
  provider: HocuspocusProvider,
  awarenessData: PresenceAwarenessData,
): void {
  const isVisible = useIsPageVisible();
  const isIdle = useIdle(PRESENCE_IDLE_TIMEOUT_MS);
  const isActive = isVisible && !isIdle;

  useEffect(() => {
    awarenessData.isActive = isActive;
    provider.setAwarenessField('awarenessData', awarenessData);
  }, [provider, awarenessData, isActive]);
}
