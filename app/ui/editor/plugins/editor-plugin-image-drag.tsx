import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  DRAGEND_COMMAND,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  mergeRegister,
  type LexicalEditor,
  type NodeKey,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { $isImageNode } from '../nodes/image-node';

/** Marks a drag as one of our images, the only kind this plugin takes. */
const IMAGE_DRAG_TYPE = 'application/x-pencil-case-image';

/** How far above the first or below the last block the bar sits. */
const EDGE_GAP = 6;

interface Gap {
  /** The block the image goes in front of, or `null` for the end. */
  beforeKey: NodeKey | null;
  top: number;
  left: number;
  width: number;
}

/**
 * Moves an image to another place in the document by dragging it. While
 * it is dragged over the editor a bar marks the gap between the blocks it
 * would land in; dropping it there moves the node in one update, which
 * syncs and undoes like any other edit. Dropping it anywhere else, or
 * pressing Escape, leaves it where it was.
 */
export const EditorPluginImageDrag: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [gap, setGap] = useState<Gap | null>(null);

  // Read in the drop handler, which runs before the bar's state lands.
  const gapRef = useRef<Gap | null>(null);
  const draggedKeyRef = useRef<NodeKey | null>(null);

  useEffect(() => {
    const showGap = (next: Gap | null) => {
      gapRef.current = next;
      setGap(next);
    };

    const endDrag = () => {
      draggedKeyRef.current = null;
      showGap(null);
    };

    const onDragLeave = (event: DragEvent) => {
      const root = editor.getRootElement();

      if (root && !root.contains(event.relatedTarget as Node | null)) {
        showGap(null);
      }
    };

    document.addEventListener('dragleave', onDragLeave);

    return mergeRegister(
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          const target = event.target as Node | null;
          const node = target ? $getNearestNodeFromDOMNode(target) : null;

          if (!$isImageNode(node) || !event.dataTransfer) {
            return false;
          }

          draggedKeyRef.current = node.getKey();
          event.dataTransfer.setData(IMAGE_DRAG_TYPE, '');
          event.dataTransfer.effectAllowed = 'move';

          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => {
          const imageKey = draggedKeyRef.current;

          if (!imageKey || !isImageDrag(event)) {
            return false;
          }

          event.preventDefault();
          event.dataTransfer!.dropEffect = 'move';
          showGap(findGap(editor, imageKey, event.clientY));

          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          const imageKey = draggedKeyRef.current;

          if (!imageKey || !isImageDrag(event)) {
            return false;
          }

          event.preventDefault();

          const target = gapRef.current;
          endDrag();

          if (target) {
            editor.update(() => $moveImage(imageKey, target.beforeKey));
          }

          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        DRAGEND_COMMAND,
        () => {
          endDrag();
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      () => document.removeEventListener('dragleave', onDragLeave),
    );
  }, [editor]);

  if (!gap) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden
      style={{ top: gap.top, left: gap.left, width: gap.width }}
      className={
        'pointer-events-none fixed z-10 h-1 -translate-y-1/2 rounded-full '
        + 'bg-pca-yellow-500'
      }
    />,
    document.body,
  );
};

function isImageDrag(event: DragEvent) {
  return event.dataTransfer?.types.includes(IMAGE_DRAG_TYPE) ?? false;
}

/**
 * The gap between the top-level blocks nearest to the pointer, or none
 * when that gap is right above or below the image, where it already is.
 */
function findGap(
  editor: LexicalEditor,
  imageKey: NodeKey,
  clientY: number,
): Gap | null {
  const root = editor.getRootElement();

  if (!root) {
    return null;
  }

  const blocks = editor.getEditorState()
    .read(() => $getRoot().getChildrenKeys())
    .flatMap((key) => {
      const element = editor.getElementByKey(key);
      return element ? [{ key, rect: element.getBoundingClientRect() }] : [];
    });

  const imageIndex = blocks.findIndex(({ key }) => key === imageKey);
  let index = blocks.findIndex(
    ({ rect }) => clientY < rect.top + rect.height / 2,
  );

  if (index === -1) {
    index = blocks.length;
  }

  if (imageIndex === -1 || index === imageIndex || index === imageIndex + 1) {
    return null;
  }

  const previous = blocks[index - 1];
  const next = blocks[index];
  const { left, width } = contentBox(root);

  if (!next) {
    const top = previous.rect.bottom + EDGE_GAP;
    return { beforeKey: null, top, left, width };
  }

  const top = previous
    ? (previous.rect.bottom + next.rect.top) / 2
    : next.rect.top - EDGE_GAP;

  return { beforeKey: next.key, top, left, width };
}

/** The column the blocks are laid out in, inside the root's padding. */
function contentBox(root: HTMLElement) {
  const rect = root.getBoundingClientRect();
  const style = getComputedStyle(root);
  const paddingLeft = parseFloat(style.paddingLeft);
  const paddingRight = parseFloat(style.paddingRight);

  return {
    left: rect.left + paddingLeft,
    width: rect.width - paddingLeft - paddingRight,
  };
}

/**
 * Puts the image in front of the given block, or at the end, and keeps a
 * paragraph after an image that would otherwise end the document.
 */
function $moveImage(imageKey: NodeKey, beforeKey: NodeKey | null) {
  const image = $getNodeByKey(imageKey);

  if (!$isImageNode(image)) {
    return;
  }

  if (beforeKey) {
    $getNodeByKey(beforeKey)?.insertBefore(image);
  }
  else {
    $getRoot().append(image);
  }

  if (!image.getNextSibling()) {
    image.insertAfter($createParagraphNode());
  }
}
