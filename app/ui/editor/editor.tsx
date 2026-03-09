import { LexicalComposer } from '@lexical/react/LexicalComposer';
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
import { EditorPluginMarkdown } from './plugins/editor-plugin-markdown';
import { EditorPluginAutoLink } from './plugins/editor-plugin-auto-link';
import { EditorPluginToolbar } from './plugins/editor-plugin-toolbar';
import editorTheme from './editor-theme';

import './editor.css';
import { EditorPluginRichText } from './plugins/editor-plugin-rich-text';

export type EditorConfig = ComponentProps<typeof LexicalComposer>['initialConfig'];

export interface EditorProps extends React.PropsWithChildren {
  initialEditorState?: EditorConfig['editorState'];
  avatars: string[];
}

export const Editor: React.FC<EditorProps> = ({
  initialEditorState,
  children,
}) => {
  const config = useMemo<EditorConfig>(() => ({
    editorState: initialEditorState ?? null,
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
  }), [initialEditorState]);

  return (
    <div className="w-full relative">
      <LexicalComposer initialConfig={config}>
        <EditorPluginToolbar />
        <EditorPluginRichText />
        <CheckListPlugin />
        <ListPlugin />
        <ClickableLinkPlugin />
        <TabIndentationPlugin maxIndent={3} />
        <EditorPluginAutoLink />
        <EditorPluginMarkdown />
        {children}
      </LexicalComposer>
    </div>
  );
};
