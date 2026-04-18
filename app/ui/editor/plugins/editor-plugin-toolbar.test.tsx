import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { EditorPluginToolbar } from './editor-plugin-toolbar';

function renderToolbar() {
  return render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        onError: (error) => {
          throw error;
        },
        nodes: [HeadingNode, ListNode, ListItemNode],
      }}
    >
      <EditorPluginToolbar />
      <RichTextPlugin
        contentEditable={
          <ContentEditable aria-label="editor" />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <CheckListPlugin />
    </LexicalComposer>,
  );
}

describe('EditorPluginToolbar', () => {
  test('renders all toggle buttons', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: 'Heading 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Heading 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Heading 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Underline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bulleted list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Numbered list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Checklist' })).toBeInTheDocument();
  });

  test('toggles bold when B is clicked', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Hello');

    const boldButton = screen.getByRole('button', { name: 'Bold' });
    await user.click(boldButton);

    expect(boldButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(boldButton);
    expect(boldButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('toggles italic when I is clicked', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Hello');

    const italicButton = screen.getByRole('button', { name: 'Italic' });
    await user.click(italicButton);

    expect(italicButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(italicButton);
    expect(italicButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('toggles underline when U is clicked', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Hello');

    const underlineButton = screen.getByRole('button', { name: 'Underline' });
    await user.click(underlineButton);

    expect(underlineButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(underlineButton);
    expect(underlineButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('toggles H1 block when H1 is clicked', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Hello');

    const h1Button = screen.getByRole('button', { name: 'Heading 1' });
    await user.click(h1Button);

    expect(h1Button).toHaveAttribute('aria-pressed', 'true');
  });

  test('toggles H2 block when H2 is clicked', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Hello');

    const h2Button = screen.getByRole('button', { name: 'Heading 2' });
    await user.click(h2Button);

    expect(h2Button).toHaveAttribute('aria-pressed', 'true');
  });

  test('toggles H3 block when H3 is clicked', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Hello');

    const h3Button = screen.getByRole('button', { name: 'Heading 3' });
    await user.click(h3Button);

    expect(h3Button).toHaveAttribute('aria-pressed', 'true');
  });

  test('reverts heading to paragraph when same heading is clicked again', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Hello');

    const h1Button = screen.getByRole('button', { name: 'Heading 1' });
    await user.click(h1Button);
    expect(h1Button).toHaveAttribute('aria-pressed', 'true');

    await user.click(h1Button);
    expect(h1Button).toHaveAttribute('aria-pressed', 'false');
  });

  test('applies H1 block format to editor content', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    expect(editor.querySelector('h1')).toBeNull();
    expect(editor.querySelector('p')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Heading 1' }));

    expect(editor.querySelector('h1')).toBeInTheDocument();
    expect(editor.querySelector('p')).toBeNull();
  });

  test('applies H2 block format to editor content', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    expect(editor.querySelector('h2')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Heading 2' }));

    expect(editor.querySelector('h2')).toBeInTheDocument();
    expect(editor.querySelector('p')).toBeNull();
  });

  test('applies H3 block format to editor content', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    expect(editor.querySelector('h3')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Heading 3' }));

    expect(editor.querySelector('h3')).toBeInTheDocument();
    expect(editor.querySelector('p')).toBeNull();
  });

  test('reverts H1 heading back to paragraph in editor content', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    const h1Button = screen.getByRole('button', { name: 'Heading 1' });
    await user.click(h1Button);
    expect(editor.querySelector('h1')).toBeInTheDocument();
    expect(editor.querySelector('p')).toBeNull();

    await user.click(h1Button);
    expect(editor.querySelector('h1')).toBeNull();
    expect(editor.querySelector('p')).toBeInTheDocument();
  });

  test('toggles bullet list when Bulleted list is clicked', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    const bulletButton = screen.getByRole('button', { name: 'Bulleted list' });
    await user.click(bulletButton);

    expect(bulletButton).toHaveAttribute('aria-pressed', 'true');
    expect(editor.querySelector('ul')).toBeInTheDocument();
    expect(editor.querySelector('p')).toBeNull();
  });

  test('toggles numbered list when Numbered list is clicked', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    const numberButton = screen.getByRole('button', { name: 'Numbered list' });
    await user.click(numberButton);

    expect(numberButton).toHaveAttribute('aria-pressed', 'true');
    expect(editor.querySelector('ol')).toBeInTheDocument();
    expect(editor.querySelector('p')).toBeNull();
  });

  test('toggles check list when Checklist is clicked', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    const checkButton = screen.getByRole('button', { name: 'Checklist' });
    await user.click(checkButton);

    expect(checkButton).toHaveAttribute('aria-pressed', 'true');
    expect(editor.querySelector('ul')).toBeInTheDocument();
    expect(editor.querySelector('p')).toBeNull();
  });

  test('reverts bullet list back to paragraph when clicked again', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    const bulletButton = screen.getByRole('button', { name: 'Bulleted list' });
    await user.click(bulletButton);
    expect(bulletButton).toHaveAttribute('aria-pressed', 'true');
    expect(editor.querySelector('ul')).toBeInTheDocument();

    await user.click(bulletButton);
    expect(bulletButton).toHaveAttribute('aria-pressed', 'false');
    expect(editor.querySelector('ul')).toBeNull();
    expect(editor.querySelector('p')).toBeInTheDocument();
  });

  test('reverts numbered list back to paragraph when clicked again', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    const numberButton = screen.getByRole('button', { name: 'Numbered list' });
    await user.click(numberButton);
    expect(numberButton).toHaveAttribute('aria-pressed', 'true');
    expect(editor.querySelector('ol')).toBeInTheDocument();

    await user.click(numberButton);
    expect(numberButton).toHaveAttribute('aria-pressed', 'false');
    expect(editor.querySelector('ol')).toBeNull();
    expect(editor.querySelector('p')).toBeInTheDocument();
  });

  test('reverts check list back to paragraph when clicked again', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const editor = screen.getByRole('textbox');
    await user.click(editor);

    const checkButton = screen.getByRole('button', { name: 'Checklist' });
    await user.click(checkButton);
    expect(checkButton).toHaveAttribute('aria-pressed', 'true');
    expect(editor.querySelector('ul')).toBeInTheDocument();

    await user.click(checkButton);
    expect(checkButton).toHaveAttribute('aria-pressed', 'false');
    expect(editor.querySelector('ul')).toBeNull();
    expect(editor.querySelector('p')).toBeInTheDocument();
  });
});
