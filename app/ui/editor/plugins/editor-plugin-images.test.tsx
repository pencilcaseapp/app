import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalEditor,
  PASTE_COMMAND,
} from 'lexical';
import { $isImageNode, ImageNode } from '../nodes/image-node';
import {
  EditorPluginImages,
  type CopyImage,
  PICK_IMAGES_COMMAND,
  type UploadImage,
} from './editor-plugin-images';

let editor: LexicalEditor;

const EditorRef: React.FC = () => {
  [editor] = useLexicalComposerContext();
  return null;
};

const image = {
  src: '/doc/a1e0b1c3-0000-4000-8000-000000000000/assets/'
    + 'b3f1c2d4-0000-4000-8000-000000000000',
  width: 800,
  height: 600,
};

const uploadImage = vi.fn<UploadImage>();
const copyImage = vi.fn<CopyImage>();

function renderPlugin() {
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        onError: (error) => {
          throw error;
        },
        nodes: [ImageNode],
      }}
    >
      <EditorRef />
      <RichTextPlugin
        contentEditable={<ContentEditable aria-label="editor" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <EditorPluginImages uploadImage={uploadImage} copyImage={copyImage} />
    </LexicalComposer>,
  );
}

/** Fills the document with paragraphs and puts the caret into one. */
function setParagraphs(texts: string[], caretIn: number) {
  editor.update(() => {
    const root = $getRoot().clear();
    const paragraphs = texts.map((text) => {
      const paragraph = $createParagraphNode();
      if (text) {
        paragraph.append($createTextNode(text));
      }
      return paragraph;
    });
    root.append(...paragraphs);
    paragraphs[caretIn].selectEnd();
  }, { discrete: true });
}

function blocks() {
  return editor.getEditorState().read(() => $getRoot().getChildren().map(
    node => $isImageNode(node) ? 'image' : node.getTextContent(),
  ));
}

async function drop(...files: File[]) {
  let handled = false;

  await act(async () => {
    handled = editor.dispatchCommand(DRAG_DROP_PASTE, files);
  });

  return handled;
}

const png = () => new File(['png'], 'image.png', { type: 'image/png' });

const otherImage = {
  src: '/doc/c4a2d3e5-0000-4000-8000-000000000000/assets/'
    + 'd5b3e4f6-0000-4000-8000-000000000000',
  width: 300,
  height: 200,
};

/** Pastes what Lexical puts on the clipboard: a paragraph and an image. */
async function pasteLexical(pastedImage: typeof image) {
  const json = JSON.stringify({
    namespace: 'test',
    nodes: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text: 'Pasted' }],
      },
      { type: 'image', version: 1, ...pastedImage },
    ],
  });
  const event = {
    clipboardData: {
      types: ['application/x-lexical-editor'],
      getData: (type: string) =>
        type === 'application/x-lexical-editor' ? json : '',
    },
    preventDefault: vi.fn(),
  } as unknown as ClipboardEvent;

  await act(async () => {
    editor.dispatchCommand(PASTE_COMMAND, event);
  });

  return event;
}

function imageSrcs() {
  return editor.getEditorState().read(() => $getRoot().getChildren()
    .filter($isImageNode)
    .map(node => node.exportJSON().src));
}

beforeEach(() => {
  uploadImage.mockReset();
  copyImage.mockReset();
  renderPlugin();
});

describe('EditorPluginImages', () => {
  test('inserts the uploaded image below the block with the caret', async () => {
    uploadImage.mockResolvedValue(image);
    setParagraphs(['First', 'Second'], 0);

    expect(await drop(png())).toBe(true);

    expect(uploadImage).toHaveBeenCalledWith(expect.any(File));
    expect(blocks()).toEqual(['First', 'image', 'Second']);
    editor.getEditorState().read(() => {
      const node = $getRoot().getChildAtIndex(1);
      expect($isImageNode(node) && node.exportJSON()).toMatchObject(image);
    });
  });

  test('takes the place of an empty paragraph', async () => {
    uploadImage.mockResolvedValue(image);
    setParagraphs(['First', '', 'Last'], 1);

    await drop(png());

    expect(blocks()).toEqual(['First', 'image', 'Last']);
  });

  test('keeps a paragraph after an image at the end', async () => {
    uploadImage.mockResolvedValue(image);
    setParagraphs(['Only'], 0);

    await drop(png());

    expect(blocks()).toEqual(['Only', 'image', '']);
  });

  test('inserts several images in the order they came', async () => {
    uploadImage
      .mockResolvedValueOnce({ ...image, width: 1 })
      .mockResolvedValueOnce({ ...image, width: 2 });
    setParagraphs(['First', 'Second'], 0);

    await drop(png(), png());

    expect(blocks()).toEqual(['First', 'image', 'image', 'Second']);
    editor.getEditorState().read(() => {
      const widths = $getRoot().getChildren()
        .filter($isImageNode)
        .map(node => node.exportJSON().width);
      expect(widths).toEqual([1, 2]);
    });
  });

  test('inserts nothing when the upload fails', async () => {
    uploadImage.mockResolvedValue(undefined);
    setParagraphs(['First'], 0);

    await drop(png());

    expect(blocks()).toEqual(['First']);
  });

  test('leaves files that are not images alone', async () => {
    setParagraphs(['First'], 0);

    const handled = await drop(
      new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }),
    );

    expect(handled).toBe(false);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  test('opens the file picker and inserts what was picked at the caret',
    async () => {
      uploadImage.mockResolvedValue(image);
      setParagraphs(['First', 'Second'], 0);
      const picker = document.querySelector<HTMLInputElement>(
        'input[type="file"]',
      )!;
      const open = vi.spyOn(picker, 'click');

      act(() => {
        editor.dispatchCommand(PICK_IMAGES_COMMAND, undefined);
      });
      expect(open).toHaveBeenCalled();

      await userEvent.upload(picker, png());

      expect(uploadImage).toHaveBeenCalledWith(expect.any(File));
      expect(blocks()).toEqual(['First', 'image', 'Second']);
    });

  test('pastes an image of another document as a copy', async () => {
    copyImage.mockResolvedValue(image);
    setParagraphs(['First'], 0);

    const event = await pasteLexical(otherImage);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(copyImage).toHaveBeenCalledWith(
      expect.objectContaining(otherImage),
    );
    expect(blocks()).toEqual(['FirstPasted', 'image']);
    expect(imageSrcs()).toEqual([image.src]);
  });

  test('leaves an image out when it could not be copied', async () => {
    copyImage.mockResolvedValue(undefined);
    setParagraphs(['First'], 0);

    await pasteLexical(otherImage);

    expect(blocks()).toEqual(['FirstPasted']);
  });

  test('leaves a paste that needs no copy to Lexical', async () => {
    copyImage.mockReturnValue(null);
    setParagraphs(['First'], 0);

    const event = await pasteLexical(image);

    expect(copyImage).toHaveBeenCalled();
    expect(imageSrcs()).toEqual([image.src]);
    expect(blocks()).toEqual(['FirstPasted', 'image']);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
});
