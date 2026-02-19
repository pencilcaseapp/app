import type { Route } from './+types/doc';
import { getConfig } from '~/config';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { CodeNode } from '@lexical/code';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/extension';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import type { Provider } from '@lexical/yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

export function loader() {
  const config = getConfig();

  return {
    wsUrl: config.ws.url,
  };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const [me] = useState<string>(() => `User #${Math.floor(Math.random() * 100)}`);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const config = useMemo(() => ({
    editorState: null,
    namespace: 'pencilCase',
    onError: console.log,
    nodes: [
      AutoLinkNode,
      LinkNode,
      ListNode,
      ListItemNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      CodeNode,
      HeadingNode,
      QuoteNode,
      HorizontalRuleNode,
    ],
  }), []);

  const providerFactory = (id: string, yjsDocMap: Map<string, Y.Doc>): Provider => {
    const doc = new Y.Doc();
    yjsDocMap.set(id, doc);

    // @ts-expect-error type mismatch between y-websocket and @lexical/yjs
    const provider: Provider = new HocuspocusProvider({
      url: loaderData.wsUrl,
      name: id,
      document: doc,
      onSynced: ({ state }) => {
        setIsSynced(state);
      },
    });

    setProvider(provider);

    return provider;
  };

  useEffect(() => {
    let rafId: number;

    const updateUsers = () => {
      if (!provider) {
        return;
      }

      const states = Array.from(provider.awareness.getStates().values());
      setUsers(states.map(state => state.name).filter(u => u !== me));
      rafId = requestAnimationFrame(updateUsers);
    };

    rafId = requestAnimationFrame(updateUsers);
    return () => cancelAnimationFrame(rafId);
  }, [provider, me]);

  return (
    <>
      <title>{params.id}</title>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
      <br />
      <br />
      <LexicalCollaboration>
        <LexicalComposer initialConfig={config}>
          <RichTextPlugin
            contentEditable={(
              <ContentEditable
                aria-placeholder="Enter some text..."
                placeholder={isSynced ? <div>Enter some text...</div> : <div></div>}
              />
            )}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <CheckListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <CollaborationPlugin
            id={params.id}
            providerFactory={providerFactory}
            shouldBootstrap={true}
            username={me}
          />
        </LexicalComposer>
      </LexicalCollaboration>
    </>
  );
}
