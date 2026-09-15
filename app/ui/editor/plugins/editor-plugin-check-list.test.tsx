import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import { $createTextNode, $getRoot, type LexicalEditor } from 'lexical';
import { EditorPluginCheckList } from './editor-plugin-check-list';

const isTouchDevice = vi.hoisted(() => ({ value: false }));

vi.mock('react-use', () => ({
  useMedia: () => isTouchDevice.value,
}));

let editor: LexicalEditor;

const EditorRef: React.FC = () => {
  [editor] = useLexicalComposerContext();
  return null;
};

function renderCheckList() {
  return render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        onError: (error) => {
          throw error;
        },
        nodes: [ListNode, ListItemNode],
        editorState: () => {
          const list = $createListNode('check');
          list.append(
            $createListItemNode(false).append($createTextNode('Save title')),
            $createListItemNode(true).append($createTextNode('Feature')),
          );
          $getRoot().append(list);
        },
      }}
    >
      <EditorRef />
      <RichTextPlugin
        contentEditable={<ContentEditable aria-label="editor" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <EditorPluginCheckList />
    </LexicalComposer>,
  );
}

const toggleFirstItem = () =>
  act(() => {
    editor.update(() => {
      const list = $getRoot().getFirstChild();
      const item = $isListNode(list) ? list.getFirstChild() : null;
      if ($isListItemNode(item)) {
        item.toggleChecked();
      }
    }, { discrete: true });
  });

describe('EditorPluginCheckList', () => {
  beforeEach(() => {
    isTouchDevice.value = false;
  });

  test('keeps the items focusable for the keyboard on other devices', () => {
    renderCheckList();

    for (const item of screen.getAllByRole('checkbox')) {
      expect(item).toHaveAttribute('tabindex', '-1');
    }
  });

  test('keeps the items unfocusable on touch devices', () => {
    isTouchDevice.value = true;
    renderCheckList();

    for (const item of screen.getAllByRole('checkbox')) {
      expect(item).not.toHaveAttribute('tabindex');
    }
  });

  test('keeps an item unfocusable after it was toggled', () => {
    isTouchDevice.value = true;
    renderCheckList();

    toggleFirstItem();

    const [item] = screen.getAllByRole('checkbox');
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(item).not.toHaveAttribute('tabindex');
  });
});
