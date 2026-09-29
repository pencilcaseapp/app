import classNames from 'classnames';
import { Topbar } from '~/ui/topbar/topbar';
import { EditorToolbar } from './editor-toolbar';

import './editor.css';

/** The room around the content, the same for the editor and the preview. */
export const getEditorContentClassName = (hasTopArea: boolean) =>
  classNames([
    hasTopArea ? 'pt-4 md:pt-6' : 'pt-15 md:pt-27',
    'pb-3 md:pb-12 touch-screen:pb-[55svh] w-full min-h-dvh px-4 md:px-[calc((100%-730px)/2)]',
  ]);

/** Shown above the content, taking over the topbar clearance. */
export const EditorTopArea: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <div className="pt-15 md:pt-27 px-4 md:px-[calc((100%-730px)/2)]">
    {children}
  </div>
);

export interface EditorPreviewContentProps {
  /** The content as the editor draws it (`renderDocumentPreview`). */
  html: string;
  hasTopArea: boolean;
}

/**
 * The content, drawn but not editable, in place of the editor's own until
 * the live connection has synced. It is marked `contenteditable` like the
 * editor's, which the editor's styles select on, with the styles Lexical
 * puts on its root.
 */
export const EditorPreviewContent: React.FC<EditorPreviewContentProps> = ({
  html,
  hasTopArea,
}) => (
  <div
    contentEditable={false}
    className={getEditorContentClassName(hasTopArea)}
    style={{
      userSelect: 'text',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}
    // Drawn by the editor's own nodes on the server, which escape the text
    // and sanitise links as they do in the browser.
    // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

export interface EditorPreviewProps {
  html: string;
  topbarLeft?: React.ReactNode;
  topbarRight?: React.ReactNode;
  notification?: React.ReactNode;
  /** Draws the formatting buttons, idle until the editor is there. */
  editable?: boolean;
}

/**
 * The page the editor draws, without the editor: what the server renders,
 * so the content is there before the scripts are. The editor shows its
 * formatting buttons from 1024 pixels up, which CSS decides here.
 */
export const EditorPreview: React.FC<EditorPreviewProps> = ({
  html,
  topbarLeft,
  topbarRight,
  notification,
  editable = false,
}) => (
  <div className="w-full relative">
    <Topbar
      left={topbarLeft}
      right={topbarRight}
      center={editable && (
        <div className="hidden lg:contents">
          <EditorToolbar canInsertImages />
        </div>
      )}
    />
    {notification && <EditorTopArea>{notification}</EditorTopArea>}
    <EditorPreviewContent html={html} hasTopArea={Boolean(notification)} />
  </div>
);
