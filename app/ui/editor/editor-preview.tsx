import classNames from 'classnames';
import { useLayoutEffect, useRef, useState } from 'react';
import { Topbar } from '~/ui/topbar/topbar';
import { EditorToolbar } from './editor-toolbar';

import './editor.css';

const TOPBAR_CLEARANCE = 'pt-[calc(3.75rem+var(--safe-area-top))]'
  + ' md:pt-[calc(6.75rem+var(--safe-area-top))]';

/** The room around the content, the same for the editor and the preview. */
export const getEditorContentClassName = (hasTopArea: boolean) =>
  classNames([
    hasTopArea ? 'pt-4 md:pt-6' : TOPBAR_CLEARANCE,
    'pb-3 md:pb-12 touch-screen:pb-[55svh] w-full min-h-dvh px-4 md:px-[calc((100%-730px)/2)]',
  ]);

/** Shown above the content, taking over the topbar clearance. */
export const EditorTopArea: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <div className={classNames(TOPBAR_CLEARANCE, 'px-4 md:px-[calc((100%-730px)/2)]')}>
    {children}
  </div>
);

export interface EditorPreviewContentProps {
  /** The content as the editor draws it (`renderDocumentPreview`). */
  html: string;
  hasTopArea: boolean;
  /**
   * Takes over the elements of the preview the server drew instead of
   * drawing them again; see `useServerPreviewNodes`.
   */
  adoptServerPreview?: boolean;
}

const SERVER_PREVIEW_ATTRIBUTE = 'data-server-preview';

/**
 * The editor replaces the server's preview as soon as the page hydrates.
 * Drawn again, every image would be a new element, which Safari leaves
 * empty for a moment even when it has the image, so the new preview swaps
 * its own elements for the server's before the page paints. It draws its
 * own first all the same, or the page would be short for a moment and the
 * browser would scroll a reader back up. The server's preview is looked up
 * while it is still on the page, before the editor replaces it.
 */
function useServerPreviewNodes(
  ref: React.RefObject<HTMLDivElement | null>,
  isEnabled: boolean,
) {
  const [serverPreview] = useState(() => (isEnabled
    ? document.querySelector(`[${SERVER_PREVIEW_ATTRIBUTE}]`)
    : null));

  useLayoutEffect(() => {
    const element = ref.current;

    if (!isEnabled || !element) {
      return;
    }

    if (serverPreview?.hasChildNodes()) {
      element.replaceChildren(...serverPreview.childNodes);
    }
  }, [ref, isEnabled, serverPreview]);
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
  adoptServerPreview = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useServerPreviewNodes(ref, adoptServerPreview);

  return (
    <div
      ref={ref}
      {...(!adoptServerPreview && { [SERVER_PREVIEW_ATTRIBUTE]: '' })}
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
};

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
