import { describe, expect, test } from 'vitest';
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $setSelection,
  createEditor,
} from 'lexical';
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text';
import { $createListItemNode, $createListNode, ListItemNode, ListNode } from '@lexical/list';
import { $findTopLevelElement, $getFormatBlock } from './node';

function createTestEditor() {
  return createEditor({
    nodes: [HeadingNode, ListNode, ListItemNode],
    onError: () => {},
  });
}

function runWithEditor(
  editor: ReturnType<typeof createEditor>,
  fn: () => void,
) {
  return new Promise<void>((resolve, reject) => {
    editor.update(
      () => {
        try {
          fn();
          resolve();
        }
        catch (error) {
          reject(error);
        }
      },
      { discrete: true },
    );
  });
}

describe('$findTopLevelElement', () => {
  test('returns the paragraph node for a text node inside a paragraph', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('Hello');
      paragraph.append(text);
      root.append(paragraph);

      const result = $findTopLevelElement(text);
      expect(result.getKey()).toBe(paragraph.getKey());
    });
  });

  test('returns the heading node for a text node inside a heading', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      const heading = $createHeadingNode('h1');
      const text = $createTextNode('Title');
      heading.append(text);
      root.append(heading);

      const result = $findTopLevelElement(text);
      expect(result.getKey()).toBe(heading.getKey());
    });
  });

  test('returns root when given the root node', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();

      const result = $findTopLevelElement(root);
      expect(result.getKey()).toBe(root.getKey());
    });
  });
});

describe('$getFormatBlock', () => {
  test('returns "p" for a paragraph', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('Hello');
      paragraph.append(text);
      root.append(paragraph);

      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 0, 'text');
      selection.focus.set(text.getKey(), 5, 'text');
      $setSelection(selection);

      expect($getFormatBlock(selection)).toBe('p');
    });
  });

  test('returns "h1" for a heading level 1', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      root.clear();
      const heading = $createHeadingNode('h1');
      const text = $createTextNode('Title');
      heading.append(text);
      root.append(heading);

      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 0, 'text');
      selection.focus.set(text.getKey(), 5, 'text');
      $setSelection(selection);

      expect($getFormatBlock(selection)).toBe('h1');
    });
  });

  test('returns "h2" for a heading level 2', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      root.clear();
      const heading = $createHeadingNode('h2');
      const text = $createTextNode('Subtitle');
      heading.append(text);
      root.append(heading);

      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 0, 'text');
      selection.focus.set(text.getKey(), 8, 'text');
      $setSelection(selection);

      expect($getFormatBlock(selection)).toBe('h2');
    });
  });

  test('returns "h3" for a heading level 3', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      root.clear();
      const heading = $createHeadingNode('h3');
      const text = $createTextNode('Section');
      heading.append(text);
      root.append(heading);

      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 0, 'text');
      selection.focus.set(text.getKey(), 7, 'text');
      $setSelection(selection);

      expect($getFormatBlock(selection)).toBe('h3');
    });
  });

  test('returns "p" for heading levels not handled (h4)', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      root.clear();
      const heading = $createHeadingNode('h4');
      const text = $createTextNode('Detail');
      heading.append(text);
      root.append(heading);

      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 0, 'text');
      selection.focus.set(text.getKey(), 6, 'text');
      $setSelection(selection);

      expect($getFormatBlock(selection)).toBe('p');
    });
  });

  test('returns "bullet" for a bullet list', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('bullet');
      const listItem = $createListItemNode();
      const text = $createTextNode('Item');
      listItem.append(text);
      list.append(listItem);
      root.append(list);

      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 0, 'text');
      selection.focus.set(text.getKey(), 4, 'text');
      $setSelection(selection);

      expect($getFormatBlock(selection)).toBe('bullet');
    });
  });

  test('returns "number" for a numbered list', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('number');
      const listItem = $createListItemNode();
      const text = $createTextNode('Step');
      listItem.append(text);
      list.append(listItem);
      root.append(list);

      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 0, 'text');
      selection.focus.set(text.getKey(), 4, 'text');
      $setSelection(selection);

      expect($getFormatBlock(selection)).toBe('number');
    });
  });

  test('returns "check" for a check list', async () => {
    const editor = createTestEditor();

    await runWithEditor(editor, () => {
      const root = $getRoot();
      root.clear();
      const list = $createListNode('check');
      const listItem = $createListItemNode();
      const text = $createTextNode('Task');
      listItem.append(text);
      list.append(listItem);
      root.append(list);

      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 0, 'text');
      selection.focus.set(text.getKey(), 4, 'text');
      $setSelection(selection);

      expect($getFormatBlock(selection)).toBe('check');
    });
  });
});
