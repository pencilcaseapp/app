import { useEffect, useState } from 'react';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import { PRESENCE_HIDDEN_GRACE_MS } from '~/constants/presence';
import type { PresenceAwarenessData } from '~/utils/presence';

/**
 * Whether the document is the page in front of the person, which the browser
 * answers itself through the Page Visibility API. A tab that goes to the
 * background is held for `PRESENCE_HIDDEN_GRACE_MS` first, so a glance at
 * another tab does not blink somebody out of everybody else's avatars, while
 * the tab left open behind an inbox runs the grace out and drops.
 */
function useIsActive(): boolean {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const holdThenDrop = () => {
      timeout = setTimeout(() => setIsActive(false), PRESENCE_HIDDEN_GRACE_MS);
    };

    const onVisibilityChange = () => {
      clearTimeout(timeout);

      if (document.hidden) {
        holdThenDrop();
      }
      else {
        setIsActive(true);
      }
    };

    if (document.hidden) {
      holdThenDrop();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return isActive;
}

/**
 * Publishes whether this connection's person is really on the document, so
 * the avatars stand for somebody who is there rather than for an open socket:
 * a tab left open in the background holds its connection for as long as the
 * browser lets it, and used to keep its owner in everybody else's list.
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
  const isActive = useIsActive();

  useEffect(() => {
    awarenessData.isActive = isActive;
    provider.setAwarenessField('awarenessData', awarenessData);
  }, [provider, awarenessData, isActive]);
}
