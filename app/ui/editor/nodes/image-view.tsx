import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import classNames from 'classnames';
import {
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  type NodeKey,
} from 'lexical';
import { useEffect, useRef } from 'react';
import { parseAssetSrc } from '~/utils/asset-src';
import { listenForEditableTap, TAP_SLOP } from '~/utils/editable-tap';

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
  const isEditable = useLexicalEditable();
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

  /*
   * A tap would otherwise go on to focus the editor, which opens the
   * keyboard and scrolls the page to make room for it. Selecting an image
   * needs neither, so the tap stops here and only selects it.
   */
  useEffect(() => {
    const image = ref.current;

    if (!image) {
      return;
    }

    let start: { x: number; y: number } | null = null;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      start = event.touches.length === 1 && touch
        ? { x: touch.clientX, y: touch.clientY }
        : null;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      const isTap = !!start && !!touch
        && Math.hypot(touch.clientX - start.x, touch.clientY - start.y)
        < TAP_SLOP;
      start = null;

      if (!isTap || !editor.isEditable()) {
        return;
      }

      event.preventDefault();
      editor.getRootElement()?.blur();
      clearSelection();
      setSelected(true);
    };

    image.addEventListener('touchstart', onTouchStart, { passive: true });
    image.addEventListener('touchend', onTouchEnd);

    return () => {
      image.removeEventListener('touchstart', onTouchStart);
      image.removeEventListener('touchend', onTouchEnd);
    };
  }, [editor, src, setSelected, clearSelection]);

  /*
   * The tap on text that follows has to find the editor as a first tap
   * would. With the image still selected, the editor turns that selection
   * into a caret of its own while the browser places one, and the keyboard
   * handling measures the wrong caret.
   */
  useEffect(() => {
    if (!isSelected) {
      return;
    }

    return listenForEditableTap(window, () => {
      editor.update(() => {
        if ($isNodeSelection($getSelection())) {
          $setSelection(null);
        }
      }, { discrete: true });
    });
  }, [editor, isSelected]);

  // Image nodes reach the editor from other people, through the live
  // document or a paste, so a node may point anywhere. Only our own assets
  // are loaded: anything else would have every reader's browser call out
  // to a server of the author's choosing.
  if (!parseAssetSrc(src)) {
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
    <div style={{ width }} className="mx-auto max-w-full rounded-sm">
      <img
        ref={ref}
        src={src}
        width={width}
        height={height}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={isEditable}
        className={classNames(
          'block h-auto w-full rounded-sm',
          isSelected && 'outline-2 outline-offset-2 outline-pca-yellow-500',
        )}
      />
    </div>
  );
};
