import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/extension';
import { useMemo, type ComponentProps } from 'react';
import { EditorPluginMarkdown } from './editor-plugin-markdown';
import { EditorPluginAutoLink } from './editor-plugin-auto-link';
import editorTheme from './editor-theme';

import './editor.css';

export type EditorConfig = ComponentProps<typeof LexicalComposer>['initialConfig'];

export interface EditorProps extends React.PropsWithChildren {
  placeholder: React.JSX.Element;
  ariaPlaceholder: string;
  avatars: string[];
}

export const Editor: React.FC<EditorProps> = ({
  children,
  placeholder,
  ariaPlaceholder,
  avatars,
}) => {
  const config = useMemo<EditorConfig>(() => ({
    editorState: null,
    namespace: 'pencilCase',
    onError: console.log,
    nodes: [
      AutoLinkNode,
      LinkNode,
      ListNode,
      ListItemNode,
      CodeNode,
      HeadingNode,
      QuoteNode,
      HorizontalRuleNode,
    ],
    theme: editorTheme,
  }), []);

  return (
    <>
      <ul>
        {avatars.map(user => (
          <li key={user}>{user}</li>
        ))}
      </ul>
      <LexicalComposer initialConfig={config}>
        <RichTextPlugin
          contentEditable={(
            <ContentEditable
              aria-placeholder={ariaPlaceholder}
              placeholder={placeholder}
            />
          )}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <CheckListPlugin />
        <ListPlugin />
        <ClickableLinkPlugin />
        <TabIndentationPlugin maxIndent={3} />
        <EditorPluginAutoLink />
        <EditorPluginMarkdown />
        {children}
      </LexicalComposer>
    </>
  );
};
