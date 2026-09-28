import {
  $generateNodesFromSerializedNodes,
  $insertGeneratedNodes,
  type BaseSerializedNode,
} from '@lexical/clipboard';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  mergeRegister,
  PASTE_COMMAND,
  PASTE_TAG,
  type LexicalCommand,
  type LexicalEditor,
  type NodeKey,
} from 'lexical';
import { useEffect, useRef } from 'react';
import {
  $createImageNode,
  ImageNode,
  type ImagePayload,
  type SerializedImageNode,
} from '../nodes/image-node';

/**
 * Stores an image and hands back what the editor shows, or nothing when it
 * could not be stored (the caller tells the person why).
 */
export type UploadImage = (file: File) => Promise<ImagePayload | undefined>;

/**
 * Copies an image pasted from another document into this one and hands
 * back what the editor shows, or nothing when it could not be copied (the
 * caller tells the person why). `null`, right away, when the image needs
 * no copy.
 */
export type CopyImage = (
  image: ImagePayload,
) => Promise<ImagePayload | undefined> | null;

/** Opens the file picker and inserts the chosen images at the caret. */
export const PICK_IMAGES_COMMAND: LexicalCommand<void>
  = createCommand('PICK_IMAGES_COMMAND');

/** What the server accepts, so the picker offers nothing else. */
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

export interface EditorPluginImagesProps {
  uploadImage: UploadImage;
  copyImage?: CopyImage;
}

/**
 * Images pasted, dropped or picked into the editor. Each one is stored
 * first and only then inserted, below the block the caret was in when it
 * arrived: an image node waiting for its upload would be part of the shared
 * document, and undoing the moment its upload finished would leave
 * everybody with an empty image. Content pasted from another document
 * waits the same way for its images to be copied into this one.
 */
export const EditorPluginImages: React.FC<EditorPluginImagesProps> = ({
  uploadImage,
  copyImage,
}) => {
  const [editor] = useLexicalComposerContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const pickedBlockKeyRef = useRef<NodeKey | null>(null);

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('EditorPluginImages: ImageNode is not registered');
    }

    return mergeRegister(
      editor.registerCommand(
        DRAG_DROP_PASTE,
        (files) => {
          const images = files.filter(file => file.type.startsWith('image/'));

          if (images.length === 0) {
            return false;
          }

          const blockKey = $getAnchorBlockKey();

          void insertImages(editor, images, blockKey, uploadImage);

          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (!copyImage || !('clipboardData' in event)) {
            return false;
          }

          const nodes = readLexicalClipboard(editor, event.clipboardData);
          const copies = new Map<
            SerializedImageNode,
            Promise<ImagePayload | undefined>
          >();

          for (const image of findImages(nodes)) {
            const copy = copyImage(image);

            if (copy) {
              copies.set(image, copy);
            }
          }

          if (copies.size === 0) {
            return false;
          }

          event.preventDefault();
          void pasteWithCopies(editor, nodes, copies);

          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        PICK_IMAGES_COMMAND,
        () => {
          // A browser opens the picker only from within the click or key
          // press that asked for it, so this has to stay synchronous.
          pickedBlockKeyRef.current = $getAnchorBlockKey();
          inputRef.current?.click();

          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, uploadImage, copyImage]);

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const images = Array.from(event.target.files ?? []);

    // Picking the same file again fires no change otherwise.
    event.target.value = '';

    void insertImages(editor, images, pickedBlockKeyRef.current, uploadImage);
  };

  return (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_IMAGE_TYPES}
      multiple
      hidden
      onChange={onPick}
    />
  );
};

async function insertImages(
  editor: LexicalEditor,
  files: File[],
  blockKey: NodeKey | null,
  uploadImage: UploadImage,
) {
  let afterKey = blockKey;

  // One after the other, so they land in the order they were dropped.
  for (const file of files) {
    const image = await uploadImage(file);

    if (!image) {
      continue;
    }

    editor.update(() => {
      afterKey = $insertImage(image, afterKey);
    });
  }
}

function $getAnchorBlockKey() {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return null;
  }

  return selection.anchor.getNode().getTopLevelElement()?.getKey() ?? null;
}

/**
 * Puts the image below the given block, in place of it when it is an empty
 * paragraph, and keeps a paragraph after an image that would otherwise end
 * the document, so there is somewhere to go on writing.
 */
function $insertImage(image: ImagePayload, afterKey: NodeKey | null) {
  const node = $createImageNode(image);
  const block = afterKey ? $getNodeByKey(afterKey) : null;

  if (!block?.isAttached()) {
    $insertNodeToNearestRoot(node);
  }
  else if ($isParagraphNode(block) && block.isEmpty()) {
    block.replace(node);
  }
  else {
    block.insertAfter(node);
  }

  if (!node.getNextSibling()) {
    node.insertAfter($createParagraphNode());
  }

  return node.getKey();
}

/** The nodes Lexical put on the clipboard, when it was this kind of editor. */
function readLexicalClipboard(
  editor: LexicalEditor,
  clipboardData: DataTransfer | null,
): BaseSerializedNode[] {
  const json = clipboardData?.getData('application/x-lexical-editor');

  if (!json) {
    return [];
  }

  try {
    const payload = JSON.parse(json);

    return payload.namespace === editor._config.namespace
      && Array.isArray(payload.nodes)
      ? payload.nodes
      : [];
  }
  catch {
    return [];
  }
}

function findImages(nodes: BaseSerializedNode[]): SerializedImageNode[] {
  return nodes.flatMap((node) => {
    if (node.type === ImageNode.getType()) {
      return [node as SerializedImageNode];
    }

    return 'children' in node && Array.isArray(node.children)
      ? findImages(node.children)
      : [];
  });
}

/**
 * Pastes the nodes once their images are copied, pointing at the copies.
 * An image that could not be copied is left out rather than pasted broken.
 */
async function pasteWithCopies(
  editor: LexicalEditor,
  nodes: BaseSerializedNode[],
  copies: Map<SerializedImageNode, Promise<ImagePayload | undefined>>,
) {
  const copied = new Map<BaseSerializedNode, ImagePayload | undefined>();

  for (const [image, copy] of copies) {
    copied.set(image, await copy);
  }

  const withCopies = (list: BaseSerializedNode[]): BaseSerializedNode[] =>
    list.flatMap((node) => {
      if (copied.has(node)) {
        const copy = copied.get(node);
        return copy ? [{ ...node, ...copy }] : [];
      }

      return 'children' in node && Array.isArray(node.children)
        ? [{ ...node, children: withCopies(node.children) }]
        : [node];
    });

  editor.update(() => {
    const selection = $getSelection() ?? $getRoot().selectEnd();

    $insertGeneratedNodes(
      editor,
      $generateNodesFromSerializedNodes(withCopies(nodes)),
      selection,
    );
  }, { tag: PASTE_TAG });
}
