import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import classNames from 'classnames';
import { CLICK_COMMAND, COMMAND_PRIORITY_LOW, type NodeKey } from 'lexical';
import { useEffect, useRef } from 'react';

/*
 * Image nodes reach the editor from other people, through the live
 * document or a paste, so a node may point anywhere. Only our own assets
 * are loaded: anything else would have every reader's browser call out to
 * a server of the author's choosing.
 */
const ASSET_SRC = /^\/user-assets\/[0-9a-f-]{36}$/;

export interface ImageViewProps {
  nodeKey: NodeKey;
  src: string;
  width: number;
  height: number;
}

/**
 * Shown at its own width, but never wider than the column. The width and
 * height attributes give the browser the aspect ratio up front, so the box
 * is there before the image has loaded.
 */
export const ImageView: React.FC<ImageViewProps> = ({
  nodeKey,
  src,
  width,
  height,
}) => {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection]
    = useLexicalNodeSelection(nodeKey);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => editor.registerCommand(
    CLICK_COMMAND,
    (event) => {
      if (!editor.isEditable() || event.target !== ref.current) {
        return false;
      }

      if (!event.shiftKey) {
        clearSelection();
      }

      setSelected(true);

      return true;
    },
    COMMAND_PRIORITY_LOW,
  ), [editor, setSelected, clearSelection]);

  if (!ASSET_SRC.test(src)) {
    return (
      <div
        style={{ aspectRatio: `${width} / ${height}`, width }}
        className={classNames(
          'mx-auto max-w-full rounded-sm',
          'bg-pca-grey-100 dark:bg-pca-grey-800',
        )}
      />
    );
  }

  return (
    <img
      ref={ref}
      src={src}
      width={width}
      height={height}
      alt=""
      draggable={false}
      className={classNames(
        'mx-auto block h-auto max-w-full rounded-sm',
        isSelected && 'outline-2 outline-offset-2 outline-pca-yellow-500',
      )}
    />
  );
};
