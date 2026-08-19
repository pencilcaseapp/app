import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import * as Y from 'yjs';
import {
  syncCursorPositions,
  type Provider,
  type SyncCursorPositionsFn,
} from '@lexical/yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Editor } from '~/ui/editor/editor';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSocketClient } from '~/contexts/socket-client';
import { useExtractDocumentTitle } from '~/hooks/use-extract-document-title';
import { useFirstLocalEdit } from '~/hooks/use-first-local-edit';
import { useAccessRevoked } from '~/hooks/use-access-revoked';
import { useCollaborators } from '~/hooks/use-collaborators';
import { useCursorNameBounds } from '~/hooks/use-cursor-name-bounds';
import { useVirtualKeyboard } from '~/hooks/use-virtual-keyboard';
import { createPortal } from 'react-dom';
import { getGuestId } from '~/utils/guest-id';
import {
  getGuestPresenceIdentity,
  type Collaborator,
  type PresenceAwarenessData,
} from '~/utils/presence';

/**
 * Draw the remote selections with the browser's own highlights rather than
 * one absolutely positioned span per line rect, which drops lines it reads as
 * spanning the whole editor. The plugin's `selectionHighlight` prop only
 * reaches the awareness path, and a cursor keeps whichever rendering it was
 * first drawn with, so it is asked for here instead — this runs on both.
 */
const syncCursorPositionsFn: SyncCursorPositionsFn = (binding, provider) => {
  syncCursorPositions(binding, provider, { selectionHighlight: true });
};

export interface CollaborativeEditorProps {
  id: string;
  presence: Collaborator | null;
  onTitleChange?: (title: string | null) => void;
  onFirstEdit?: () => void;
  onAccessRevoked?: () => void;
  topbarLeft?: React.ReactNode;
  topbarRight?: React.ReactNode;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps>
  = ({
    id,
    presence,
    onTitleChange,
    onFirstEdit,
    onAccessRevoked,
    topbarLeft,
    topbarRight,
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isSynced, setIsSynced] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [isVirtualKeyboardOpen] = useVirtualKeyboard();
    const socketClient = useSocketClient();
    // A signed out visitor is identified by a guest id kept in their browser,
    // so they keep their name and colour when they come back.
    const [identity] = useState(
      () => presence ?? getGuestPresenceIdentity(getGuestId()),
    );
    // Lexical re-runs its awareness effects whenever this changes identity,
    // so it has to stay the same object for as long as the editor is open.
    const awarenessData = useMemo<PresenceAwarenessData>(
      () => ({ presenceId: identity.id }),
      [identity.id],
    );
    const [doc] = useState(() => new Y.Doc());
    useExtractDocumentTitle(doc, onTitleChange);
    const [provider] = useState(() => new HocuspocusProvider({
      name: id,
      websocketProvider: socketClient,
      document: doc,
      onSynced: ({ state }) => {
        setIsSynced(state);
      },
    }));

    const collaborators = useCollaborators(provider);

    useCursorNameBounds(ref);
    useFirstLocalEdit(doc, provider, onFirstEdit);
    useAccessRevoked(provider, onAccessRevoked);

    const [providerFactory] = useState(() => (
      id: string,
      yjsDocMap: Map<string, Y.Doc>,
    ): Provider => {
      yjsDocMap.set(id, doc);

      return {
        // @ts-expect-error type mismatch
        awareness: provider.awareness,
        connect: () => {
          if (!provider.isAttached) {
            provider.attach();
          }
        },
        disconnect: () => {},
        on: provider.on.bind(provider),
        off: provider.off.bind(provider),
      };
    });

    useEffect(() => {
      return () => {
        provider.detach();
      };
    }, [provider]);

    useEffect(() => {
      if (isVirtualKeyboardOpen) {
        ref.current?.style.setProperty('visibility', 'hidden');
      }
      else {
        ref.current?.style.removeProperty('visibility');
      }
    }, [isVirtualKeyboardOpen]);

    return (
      <LexicalCollaboration>
        <Editor
          avatars={collaborators}
          topbarLeft={topbarLeft}
          topbarRight={topbarRight}
        >
          <CollaborationPlugin
            id={id}
            providerFactory={providerFactory}
            shouldBootstrap={true}
            username={identity.name}
            cursorColor={identity.color}
            awarenessData={awarenessData}
            cursorsContainerRef={ref}
            syncCursorPositionsFn={syncCursorPositionsFn}
          />
          {createPortal(<div ref={ref}></div>, document.body)}
        </Editor>
      </LexicalCollaboration>
    );
  };
