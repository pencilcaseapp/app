import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import * as Y from 'yjs';
import type { Provider } from '@lexical/yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Editor } from '~/ui';
import { useCallback, useEffect, useState } from 'react';
import { extractTitleFromYDoc, getDocFromMap } from '~/utils/yjs';

export interface CollaborativeEditorProps {
  id: string;
  wsUrl: string;
  onTitleChange?: (title: string | null) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps>
  = ({ id, wsUrl, onTitleChange }) => {
    const [isSynced, setIsSynced] = useState(false);
    const [avatars, setAvatars] = useState<string[]>([]);
    const [doc, setDoc] = useState<Y.Doc>();

    const handleUpdate = useCallback(() => {
      if (!isSynced || !doc) return;
      const title = extractTitleFromYDoc(doc);
      onTitleChange?.(title);
    }, [isSynced, onTitleChange, doc]);

    useEffect(() => {
      if (!doc) return;
      doc.on('update', handleUpdate);

      return () => {
        doc.off('update', handleUpdate);
      };
    }, [doc, handleUpdate]);

    const providerFactory = useCallback((
      id: string,
      yjsDocMap: Map<string, Y.Doc>,
    ): Provider => {
      const doc = getDocFromMap(id, yjsDocMap);
      setDoc(doc);

      const provider = new HocuspocusProvider({
        name: id,
        document: doc,
        url: wsUrl,
        onSynced: ({ state }) => {
          setIsSynced(state);
        },
        onAwarenessChange({ states }) {
          setAvatars(states.map(state => state.name));
        },
      });

      return {
        // @ts-expect-error type mismatch
        awareness: provider.awareness,
        connect: () => {},
        disconnect: () => {},
        on: provider.on.bind(provider),
        off: provider.off.bind(provider),
      };
    }, [wsUrl]);

    return (
      <LexicalCollaboration>
        <Editor
          avatars={avatars}
        >
          <CollaborationPlugin
            id={id}
            providerFactory={providerFactory}
            shouldBootstrap={true}
          />
        </Editor>
      </LexicalCollaboration>
    );
  };
