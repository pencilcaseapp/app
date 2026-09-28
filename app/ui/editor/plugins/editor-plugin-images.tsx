import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  mergeRegister,
  type LexicalCommand,
  type LexicalEditor,
  type NodeKey,
} from 'lexical';
import { useEffect, useRef } from 'react';
import { $createImageNode, ImageNode, type ImagePayload } from '../nodes/image-node';

/**
 * Stores an image and hands back what the editor shows, or nothing when it
 * could not be stored (the caller tells the person why).
 */
export type UploadImage = (file: File) => Promise<ImagePayload | undefined>;

/** Opens the file picker and inserts the chosen images at the caret. */
export const PICK_IMAGES_COMMAND: LexicalCommand<void>
  = createCommand('PICK_IMAGES_COMMAND');

/** What the server accepts, so the picker offers nothing else. */
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

export interface EditorPluginImagesProps {
  uploadImage: UploadImage;
}

/**
 * Images pasted, dropped or picked into the editor. Each one is stored
 * first and only then inserted, below the block the caret was in when it
 * arrived: an image node waiting for its upload would be part of the shared
 * document, and undoing the moment its upload finished would leave
 * everybody with an empty image.
 */
export const EditorPluginImages: React.FC<EditorPluginImagesProps> = ({
  uploadImage,
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
  }, [editor, uploadImage]);

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
