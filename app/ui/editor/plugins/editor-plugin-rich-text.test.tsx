import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { EditorPluginRichText } from './editor-plugin-rich-text';
import { revealCaret } from '../utils/caret';

const isTouchDevice = vi.hoisted(() => ({ value: true }));

vi.mock('react-use', () => ({
  useMedia: () => isTouchDevice.value,
}));

vi.mock('../utils/caret', () => ({
  revealCaret: vi.fn(),
}));

const VIEWPORT_HEIGHT = 800;

const viewport = new EventTarget() as VisualViewport;

const setViewport = (
  values: { height?: number; pageTop?: number },
  event: 'resize' | 'scroll',
) =>
  act(() => {
    for (const [key, value] of Object.entries(values)) {
      Object.defineProperty(viewport, key, { value, configurable: true });
    }

    viewport.dispatchEvent(new Event(event));
  });

const openKeyboard = (pageTop: number) => {
  document.documentElement.scrollTop = pageTop;
  setViewport({ height: 400, pageTop }, 'resize');
};

function renderEditor() {
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        onError: (error) => {
          throw error;
        },
        editorState: () => {
          $getRoot().append(
            $createParagraphNode().append($createTextNode('Hello')),
          );
        },
      }}
    >
      <EditorPluginRichText />
    </LexicalComposer>,
  );

  return screen.getByRole('textbox');
}

describe('EditorPluginRichText', () => {
  beforeEach(() => {
    isTouchDevice.value = true;
    Object.defineProperty(window, 'innerHeight', {
      value: VIEWPORT_HEIGHT,
      configurable: true,
    });
    Object.defineProperty(window, 'visualViewport', {
      value: viewport,
      configurable: true,
    });
    Object.defineProperty(viewport, 'height', {
      value: VIEWPORT_HEIGHT,
      configurable: true,
    });
    Object.defineProperty(viewport, 'pageTop', {
      value: 0,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.mocked(revealCaret).mockClear();
    document.documentElement.scrollTop = 0;
  });

  test('sizes the content to the viewport and takes over the scroll', () => {
    const content = renderEditor();
    act(() => content.focus());

    openKeyboard(300);

    expect(content.style.height).toBe('400px');
    expect(content.style.minHeight).toBe('auto');
    expect(content.scrollTop).toBe(300);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.style.overflow).toBe('hidden');
    expect(revealCaret).toHaveBeenCalledWith(content, expect.anything());
  });

  test('scrolls the window back when the viewport moves', () => {
    const content = renderEditor();
    act(() => content.focus());
    openKeyboard(300);
    vi.mocked(revealCaret).mockClear();

    document.documentElement.scrollTop = 250;
    setViewport({ pageTop: 250 }, 'scroll');

    expect(document.documentElement.scrollTop).toBe(0);
    expect(content.scrollTop).toBe(300);
    expect(revealCaret).toHaveBeenCalledWith(content, expect.anything());
  });

  test('follows the viewport height', () => {
    const content = renderEditor();
    act(() => content.focus());
    openKeyboard(300);
    vi.mocked(revealCaret).mockClear();

    setViewport({ height: 350 }, 'resize');

    expect(content.style.height).toBe('350px');
    expect(revealCaret).toHaveBeenCalledWith(content, expect.anything());
  });

  test('hands the scroll back to the page on blur', () => {
    const content = renderEditor();
    act(() => content.focus());
    openKeyboard(300);
    content.scrollTop = 320;

    act(() => content.blur());

    expect(content.style.height).toBe('');
    expect(content.style.minHeight).toBe('');
    expect(content.scrollTop).toBe(0);
    expect(document.documentElement.scrollTop).toBe(320);
    expect(document.body.style.overflow).toBe('');
  });

  test('stops following the viewport once released', () => {
    const content = renderEditor();
    act(() => content.focus());
    openKeyboard(300);
    act(() => content.blur());

    document.documentElement.scrollTop = 100;
    setViewport({ height: 500, pageTop: 100 }, 'scroll');

    expect(document.documentElement.scrollTop).toBe(100);
    expect(content.style.height).toBe('');
  });

  test('hands the scroll back when the keyboard closes without a blur', () => {
    const content = renderEditor();
    act(() => content.focus());
    openKeyboard(300);

    setViewport({ height: VIEWPORT_HEIGHT }, 'resize');

    expect(content.style.height).toBe('');
    expect(document.documentElement.scrollTop).toBe(300);
    expect(document.body.style.overflow).toBe('');
  });
});
