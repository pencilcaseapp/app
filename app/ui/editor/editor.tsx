import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { useMemo, type ComponentProps } from 'react';
import { EditorPluginMarkdown } from './plugins/editor-plugin-markdown';
import { EditorPluginAutoLink } from './plugins/editor-plugin-auto-link';
import { EditorPluginCodePrism } from './plugins/editor-plugin-code-prism';
import { EditorPluginToolbar } from './plugins/editor-plugin-toolbar';
import { EditorPluginRichText } from './plugins/editor-plugin-rich-text';
import editorTheme from './editor-theme';
import { EDITOR_NODES } from './editor-nodes';
import type { Collaborator } from '~/utils/presence';

import './editor.css';
import { EditorPluginAutoFocus } from './plugins/editor-plugin-auto-focus';
import { EditorPluginEditable } from './plugins/editor-plugin-editable';
import { EditorPluginCheckList } from './plugins/editor-plugin-check-list';
import { EditorPluginSlashMenu } from './plugins/editor-plugin-slash-menu';
import {
  EditorPluginImages,
  type CopyImage,
  type UploadImage,
} from './plugins/editor-plugin-images';
import { EditorPluginImageDrag } from './plugins/editor-plugin-image-drag';

export type EditorConfig = ComponentProps<typeof LexicalComposer>['initialConfig'];

export interface EditorProps extends React.PropsWithChildren {
  initialEditorState?: EditorConfig['editorState'];
  avatars: Collaborator[];
  topbarLeft?: React.ReactNode;
  topbarRight?: React.ReactNode;
  /** A read-only editor keeps the content and drops the formatting tools. */
  editable?: boolean;
  /** Shown between the topbar and the content. */
  notification?: React.ReactNode;
  /** Laid over the content and scrolled along with it. */
  contentOverlay?: React.ReactNode;
  /** Lets people paste, drop and pick images; without it they cannot. */
  uploadImage?: UploadImage;
  /** Copies the images of content pasted from another document. */
  copyImage?: CopyImage;
  /**
   * The content as HTML, shown in place of the editor until it has its
   * own; see `EditorPluginRichText`.
   */
  preview?: string | null;
}

export const Editor: React.FC<EditorProps> = ({
  initialEditorState,
  avatars,
  topbarLeft,
  topbarRight,
  editable = true,
  notification,
  contentOverlay,
  uploadImage,
  copyImage,
  preview,
  children,
}) => {
  const config = useMemo<EditorConfig>(() => ({
    editorState: initialEditorState ?? null,
    editable,
    namespace: 'pencilCase',
    onError: console.log,
    nodes: EDITOR_NODES,
    theme: editorTheme,
  }), [initialEditorState, editable]);

  return (
    <div className="w-full relative">
      <LexicalComposer initialConfig={config}>
        <EditorPluginEditable editable={editable} />
        <EditorPluginToolbar
          avatars={avatars}
          topbarLeft={topbarLeft}
          topbarRight={topbarRight}
          editable={editable}
          canInsertImages={Boolean(uploadImage)}
        />
        <EditorPluginRichText
          topArea={notification}
          contentOverlay={contentOverlay}
          preview={preview}
        />
        {editable && typeof preview !== 'string' && <EditorPluginAutoFocus />}
        {editable && (
          <EditorPluginSlashMenu canInsertImages={Boolean(uploadImage)} />
        )}
        {editable && uploadImage && (
          <EditorPluginImages
            uploadImage={uploadImage}
            copyImage={copyImage}
          />
        )}
        {editable && <EditorPluginImageDrag />}
        <EditorPluginCheckList />
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
