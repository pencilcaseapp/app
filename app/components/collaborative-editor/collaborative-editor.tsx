import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import * as Y from 'yjs';
import type { Provider } from '@lexical/yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Editor } from '~/ui';
import { useEffect, useRef, useState } from 'react';
import { useSocketClient } from '~/contexts/socket-client';
import { useDocumentTitle } from '~/hooks/use-document-title';
import { useVirtualKeyboard } from '~/hooks/use-virtual-keyboard';
import { createPortal } from 'react-dom';

export interface CollaborativeEditorProps {
  id: string;
  onTitleChange?: (title: string | null) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps>
  = ({ id, onTitleChange }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isSynced, setIsSynced] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [isVirtualKeyboardOpen] = useVirtualKeyboard();
    const [avatars, setAvatars] = useState<string[]>([]);
    const socketClient = useSocketClient();
    const [doc] = useState(() => new Y.Doc());
    useDocumentTitle(doc, onTitleChange);
    const [provider] = useState(() => new HocuspocusProvider({
      name: id,
      websocketProvider: socketClient,
      document: doc,
      onSynced: ({ state }) => {
        setIsSynced(state);
      },
      onAwarenessChange({ states }) {
        setAvatars(states.map(state => state.name));
      },
    }));

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
        ref.current?.style.setProperty('display', 'none');
      }
      else {
        ref.current?.style.removeProperty('display');
      }
    }, [isVirtualKeyboardOpen]);

    return (
      <LexicalCollaboration>
        <Editor avatars={avatars}>
          <CollaborationPlugin
            id={id}
            providerFactory={providerFactory}
            shouldBootstrap={true}
            cursorsContainerRef={ref}
          />
          {createPortal(<div ref={ref}></div>, document.body)}
        </Editor>
      </LexicalCollaboration>
    );
  };
