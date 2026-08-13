import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code-core';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/extension';
import { useMemo, type ComponentProps } from 'react';
import { EditorPluginMarkdown } from './plugins/editor-plugin-markdown';
import { EditorPluginAutoLink } from './plugins/editor-plugin-auto-link';
import { EditorPluginCodePrism } from './plugins/editor-plugin-code-prism';
import { EditorPluginToolbar } from './plugins/editor-plugin-toolbar';
import { EditorPluginRichText } from './plugins/editor-plugin-rich-text';
import editorTheme from './editor-theme';

import './editor.css';
import { EditorPluginAutoFocus } from './plugins/editor-plugin-auto-focus';

export type EditorConfig = ComponentProps<typeof LexicalComposer>['initialConfig'];

export interface EditorProps extends React.PropsWithChildren {
  initialEditorState?: EditorConfig['editorState'];
  avatars: string[];
  topbarLeft?: React.ReactNode;
  topbarRight?: React.ReactNode;
}

export const Editor: React.FC<EditorProps> = ({
  initialEditorState,
  topbarLeft,
  topbarRight,
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
      CodeHighlightNode,
      HeadingNode,
      QuoteNode,
      HorizontalRuleNode,
    ],
    theme: editorTheme,
  }), [initialEditorState]);

  return (
    <div className="w-full relative">
      <LexicalComposer initialConfig={config}>
        <EditorPluginToolbar
          topbarLeft={topbarLeft}
          topbarRight={topbarRight}
        />
        <EditorPluginRichText />
        <EditorPluginAutoFocus />
        <CheckListPlugin />
        <ListPlugin />
        <ClickableLinkPlugin newTab />
        <TabIndentationPlugin maxIndent={3} />
        <EditorPluginAutoLink />
        <EditorPluginMarkdown />
        <EditorPluginCodePrism />
        {children}
      </LexicalComposer>
    </div>
  );
};
