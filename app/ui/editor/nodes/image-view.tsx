import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import classNames from 'classnames';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  type NodeKey,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';
import { listenForEditableTap, TAP_SLOP } from '~/utils/editable-tap';
import type { ImageNode } from './image-node';

/*
 * Image nodes reach the editor from other people, through the live
 * document or a paste, so a node may point anywhere. Only our own assets
 * are loaded: anything else would have every reader's browser call out to
 * a server of the author's choosing.
 */
const ASSET_SRC = /^\/user-assets\/[0-9a-f-]{36}$/;

/** The narrowest an image can be made, in pixels. */
const MIN_RESIZE_WIDTH = 48;

type Side = 'left' | 'right';

export interface ImageViewProps {
  nodeKey: NodeKey;
  src: string;
  width: number;
  height: number;
  displayWidth: number | null;
}

/**
 * Shown at the share of the column it was resized to, or at its own width,
 * and never wider than either the column or its own width. The width and
 * height attributes give the browser the aspect ratio up front, so the box
 * is there before the image has loaded.
 */
export const ImageView: React.FC<ImageViewProps> = ({
  nodeKey,
  src,
  width,
  height,
  displayWidth,
}) => {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection]
    = useLexicalNodeSelection(nodeKey);
  const ref = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);

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

  /*
   * The width follows the pointer locally and is written to the node once,
   * on release, so a resize is one change for the others and one undo step
   * rather than one per pointer move.
   */
  const startResize = (side: Side) => (event: React.PointerEvent) => {
    const frame = frameRef.current;
    const column = frame?.parentElement;

    if (!frame || !column || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const columnWidth = column.clientWidth;
    const maxWidth = Math.min(columnWidth, width);
    const minWidth = Math.min(MIN_RESIZE_WIDTH, maxWidth);
    const startX = event.clientX;
    const startWidth = frame.offsetWidth;
    const direction = side === 'right' ? 1 : -1;
    let nextWidth = startWidth;

    const onMove = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX) * direction;
      nextWidth = Math.min(Math.max(startWidth + delta, minWidth), maxWidth);
      setResizeWidth(nextWidth);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);

      if (nextWidth !== startWidth) {
        editor.update(() => {
          $getNodeByKey<ImageNode>(nodeKey)
            ?.setDisplayWidth(nextWidth / columnWidth);
        });
      }

      setResizeWidth(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const frameStyle: React.CSSProperties = {
    width: resizeWidth ?? (displayWidth ? `${displayWidth * 100}%` : width),
    maxWidth: `min(100%, ${width}px)`,
  };

  if (!ASSET_SRC.test(src)) {
    return (
      <div
        style={{ ...frameStyle, aspectRatio: `${width} / ${height}` }}
        className={classNames(
          'mx-auto rounded-sm',
          'bg-pca-grey-100 dark:bg-pca-grey-800',
        )}
      />
    );
  }

  const isResizable = isSelected && editor.isEditable();

  return (
    <div ref={frameRef} style={frameStyle} className="relative mx-auto">
      <img
        ref={ref}
        src={src}
        width={width}
        height={height}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className={classNames(
          'block h-auto w-full rounded-sm',
          isSelected && 'outline-2 outline-offset-2 outline-pca-yellow-500',
        )}
      />
      {isResizable && (['left', 'right'] as const).map(side => (
        <div
          key={side}
          aria-hidden
          data-resize-handle={side}
          onPointerDown={startResize(side)}
          className={classNames(
            'absolute top-1/2 h-12 max-h-[50%] w-1.5 -translate-y-1/2',
            'cursor-ew-resize touch-none rounded-full',
            'bg-pca-yellow-500',
            side === 'left' ? 'left-1' : 'right-1',
          )}
        />
      ))}
    </div>
  );
};
