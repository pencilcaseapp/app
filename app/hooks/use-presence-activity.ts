import { useEffect, useState } from 'react';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import { PRESENCE_IDLE_TIMEOUT_MS } from '~/constants/presence';
import type { PresenceAwarenessData } from '~/utils/presence';

const ACTIVITY_EVENTS = [
  'pointermove',
  'pointerdown',
  'keydown',
  'wheel',
  'touchstart',
];

/**
 * Whether the person is on the document: something has happened within
 * `PRESENCE_IDLE_TIMEOUT_MS`, where something is either touching the page or
 * leaving it for another tab. Hiding the tab therefore starts the countdown
 * rather than ending it — a glance at another tab keeps you in the document,
 * a tab left behind one drops out of it. Nothing can happen to a page nobody
 * is looking at, so the countdown runs out on its own from there.
 */
function useIsActive(): boolean {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const countdown = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsActive(false), PRESENCE_IDLE_TIMEOUT_MS);
    };

    const onActivity = () => {
      countdown();
      setIsActive(true);
    };

    countdown();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    document.addEventListener('visibilitychange', onActivity);

    return () => {
      clearTimeout(timeout);

      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }

      document.removeEventListener('visibilitychange', onActivity);
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
