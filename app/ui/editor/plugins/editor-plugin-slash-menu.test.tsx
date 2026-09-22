import { describe, expect, test } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { $isHeadingNode, HeadingNode } from '@lexical/rich-text';
import { $isListNode, ListItemNode, ListNode } from '@lexical/list';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  type LexicalCommand,
  type LexicalEditor,
} from 'lexical';
import { EditorPluginSlashMenu } from './editor-plugin-slash-menu';

let editor: LexicalEditor;

const EditorRef: React.FC = () => {
  [editor] = useLexicalComposerContext();
  return null;
};

function renderSlashMenu() {
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        onError: (error) => {
          throw error;
        },
        nodes: [HeadingNode, ListNode, ListItemNode],
      }}
    >
      <EditorRef />
      <RichTextPlugin
        contentEditable={<ContentEditable aria-label="editor" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <CheckListPlugin />
      <EditorPluginSlashMenu />
    </LexicalComposer>,
  );

  // The menu is positioned from the DOM selection, which Lexical only writes
  // while the editor has the focus.
  act(() => {
    editor.focus();
  });

  return { user: userEvent.setup() };
}

/**
 * happy-dom turns neither a key press into text in a contenteditable nor a
 * key press into one of Lexical's key commands, so the typing and the keys
 * the menu answers go through the editor itself.
 */
const type = (text: string) =>
  act(async () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(text);
      }
    }, { discrete: true });
  });

function press<T extends KeyboardEvent | null>(
  command: LexicalCommand<T>,
  key: string,
) {
  return act(async () => {
    editor.dispatchCommand(command, new KeyboardEvent('keydown', { key }) as T);
  });
}

const rowType = () =>
  editor.getEditorState().read(() => {
    const row = $getRoot().getFirstChild();

    if ($isHeadingNode(row)) {
      return row.getTag();
    }

    return $isListNode(row) ? row.getListType() : row?.getType();
  });

const documentText = () =>
  editor.getEditorState().read(() => $getRoot().getTextContent());

const menuItems = () =>
  screen.queryAllByRole('menuitem').map(item => item.textContent);

describe('EditorPluginSlashMenu', () => {
  test('opens on a slash typed on an empty row', async () => {
    renderSlashMenu();

    await type('/');

    expect(screen.getByRole('menu', { name: 'Block types' }))
      .toBeInTheDocument();
    expect(menuItems()).toEqual([
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Numbered list',
      'Bulleted list',
      'Checklist',
    ]);
  });

  test('separates the headings from the lists', async () => {
    renderSlashMenu();

    await type('/');

    const children = Array.from(
      screen.getByRole('menu', { name: 'Block types' }).children,
    );
    const separators = children.filter(
      child => child.getAttribute('role') === 'separator',
    );

    expect(separators).toHaveLength(1);
    expect(children.indexOf(separators[0])).toBe(3);
  });

  test('stays closed for a slash typed after text', async () => {
    renderSlashMenu();

    await type('and/');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('filters the options by what follows the slash', async () => {
    renderSlashMenu();

    await type('/check');

    expect(menuItems()).toEqual(['Checklist']);
  });

  test('keeps the same menu while the query narrows it', async () => {
    renderSlashMenu();

    await type('/');
    const menu = screen.getByRole('menu', { name: 'Block types' });

    await type('head');

    expect(screen.getByRole('menu', { name: 'Block types' })).toBe(menu);
    expect(menuItems()).toEqual(['Heading 1', 'Heading 2', 'Heading 3']);
  });

  test('closes when nothing matches', async () => {
    renderSlashMenu();

    await type('/zzz');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('closes on escape', async () => {
    renderSlashMenu();

    await type('/');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await press(KEY_ESCAPE_COMMAND, 'Escape');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('turns the row into the chosen heading and drops the query',
    async () => {
      const { user } = renderSlashMenu();

      await type('/');
      await user.click(screen.getByRole('menuitem', { name: 'Heading 2' }));

      expect(rowType()).toBe('h2');
      expect(documentText()).toBe('');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

  test('turns the row into the chosen list', async () => {
    const { user } = renderSlashMenu();

    await type('/');
    await user.click(screen.getByRole('menuitem', { name: 'Checklist' }));

    expect(rowType()).toBe('check');
    expect(documentText()).toBe('');
  });

  test('picks the highlighted option with the arrow keys and enter',
    async () => {
      renderSlashMenu();

      await type('/');
      await press(KEY_ARROW_DOWN_COMMAND, 'ArrowDown');
      await press(KEY_ENTER_COMMAND, 'Enter');

      expect(rowType()).toBe('h2');
      expect(documentText()).toBe('');
    });
});
