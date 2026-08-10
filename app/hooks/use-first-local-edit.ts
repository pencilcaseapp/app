import { useEffect, useRef } from 'react';
import type * as Y from 'yjs';

/**
 * Calls `onFirstEdit` once, the first time `doc` is changed locally.
 *
 * Updates that the Hocuspocus provider applies (the initial sync and every
 * change coming from another client) carry the provider as their transaction
 * origin, so they are not treated as an edit by the local user.
 */
export function useFirstLocalEdit(
  doc: Y.Doc,
  remoteOrigin: unknown,
  onFirstEdit?: () => void,
) {
  const hasEditedRef = useRef(false);

  useEffect(() => {
    const handleUpdate = (_update: Uint8Array, origin: unknown) => {
      if (hasEditedRef.current || origin === remoteOrigin) {
        return;
      }

      hasEditedRef.current = true;
      onFirstEdit?.();
    };

    doc.on('update', handleUpdate);

    return () => {
      doc.off('update', handleUpdate);
    };
  }, [doc, remoteOrigin, onFirstEdit]);
}
