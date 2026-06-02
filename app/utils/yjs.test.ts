import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { createHeadlessEditor } from '@lexical/headless';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code-core';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/extension';
import {
  createBinding,
  syncLexicalUpdateToYjs,
} from '@lexical/yjs';
import type { Provider, ProviderAwareness } from '@lexical/yjs';
import type { SerializedEditorState } from 'lexical';
import { extractTitleFromYDoc, getTextFromXmlText } from './yjs';
import { initialEditorState } from '~/test/fixtures/editor';

const nodes = [
  AutoLinkNode,
  LinkNode,
  ListNode,
  ListItemNode,
  CodeNode,
  HeadingNode,
  QuoteNode,
  HorizontalRuleNode,
];

const emptyProvider: Provider = {
  awareness: {
    getStates: () => [],
    getLocalState: () => null,
  } as unknown as ProviderAwareness,
  connect: () => {},
  disconnect: () => {},
  on: () => {},
  off: () => {},
};

/**
 * Creates a Y.Doc populated with the given Lexical editor state
 * by running a real Lexical-to-Yjs sync via headless editor + binding.
 * This ensures tests break if Lexical's Yjs format changes.
 */
function createYDocFromEditorState(
  editorState: SerializedEditorState,
): Y.Doc {
  const doc = new Y.Doc();
  const editor = createHeadlessEditor({ nodes });

  // Suppress benign "Invalid access" warnings from Yjs during binding init
  // and Lexical-to-Yjs sync. These occur because createBinding reads XmlText
  // properties before they're fully attached to the document.
  const origWarn = console.warn;
  const origError = console.error;
  const suppressInvalidAccess = (...args: unknown[]) =>
    typeof args[0] === 'string' && args[0].includes('Invalid access');
  console.warn = (...args: unknown[]) => {
    if (suppressInvalidAccess(...args)) return;
    origWarn(...args);
  };
  console.error = (...args: unknown[]) => {
    if (suppressInvalidAccess(...args)) return;
    origError(...args);
  };

  try {
    const binding = createBinding(editor, emptyProvider, 'root', doc, new Map());

    editor.registerUpdateListener(({
      prevEditorState,
      editorState: currEditorState,
      dirtyLeaves,
      dirtyElements,
      normalizedNodes,
      tags,
    }) => {
      syncLexicalUpdateToYjs(
        binding,
        emptyProvider,
        prevEditorState,
        currEditorState,
        dirtyElements,
        dirtyLeaves,
        normalizedNodes,
        tags,
      );
    });

    const state = editor.parseEditorState(JSON.stringify(editorState));
    editor.setEditorState(state);
  }
  finally {
    console.warn = origWarn;
    console.error = origError;
  }

  return doc;
}

function makeEditorState(
  children: Record<string, unknown>[],
): SerializedEditorState {
  return {
    root: {
      children,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as SerializedEditorState;
}

function makeHeading(
  text: string,
  tag: 'h1' | 'h2' | 'h3' = 'h1',
) {
  return {
    children: [
      { detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'heading',
    version: 1,
    tag,
  };
}

function makeParagraph(text: string) {
  return {
    children: [
      { detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
    textFormat: 0,
    textStyle: '',
  };
}

function makeParagraphWithFormatting(
  segments: { text: string; format: number }[],
) {
  return {
    children: segments.map(({ text, format }) => ({
      detail: 0,
      format,
      mode: 'normal',
      style: '',
      text,
      type: 'text',
      version: 1,
    })),
    direction: null,
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
    textFormat: 0,
    textStyle: '',
  };
}

describe('getTextFromXmlText', () => {
  it('extracts text from a simple paragraph', () => {
    const doc = createYDocFromEditorState(
      makeEditorState([makeParagraph('Hello World')]),
    );
    const root = doc.get('root', Y.XmlText);
    const firstChild = root.toDelta()[0].insert as Y.XmlText;

    expect(getTextFromXmlText(firstChild)).toBe('Hello World');
  });

  it('extracts text with mixed formatting (bold + italic)', () => {
    const doc = createYDocFromEditorState(
      makeEditorState([
        makeParagraphWithFormatting([
          { text: 'Hello ', format: 0 },
          { text: 'bold', format: 1 },
          { text: ' and ', format: 0 },
          { text: 'italic', format: 2 },
          { text: ' world', format: 0 },
        ]),
      ]),
    );
    const root = doc.get('root', Y.XmlText);
    const firstChild = root.toDelta()[0].insert as Y.XmlText;

    expect(getTextFromXmlText(firstChild)).toBe('Hello bold and italic world');
  });

  it('extracts text with emoji', () => {
    const doc = createYDocFromEditorState(
      makeEditorState([makeParagraph('Hello 👩‍💻 World 🎉')]),
    );
    const root = doc.get('root', Y.XmlText);
    const firstChild = root.toDelta()[0].insert as Y.XmlText;

    expect(getTextFromXmlText(firstChild)).toBe('Hello 👩‍💻 World 🎉');
  });
});

describe('extractTitleFromYDoc', () => {
  it('extracts title from first block (h1 heading)', () => {
    const doc = createYDocFromEditorState(
      makeEditorState([
        makeHeading('My Document Title', 'h1'),
        makeParagraph('Some body text'),
      ]),
    );

    expect(extractTitleFromYDoc(doc)).toBe('My Document Title');
  });

  it('extracts title from a paragraph when no heading exists', () => {
    const doc = createYDocFromEditorState(
      makeEditorState([makeParagraph('A simple note')]),
    );

    expect(extractTitleFromYDoc(doc)).toBe('A simple note');
  });

  it('truncates title longer than 70 characters', () => {
    const longText = 'This is a very long title that should definitely be truncated because it exceeds seventy characters';
    const doc = createYDocFromEditorState(
      makeEditorState([makeParagraph(longText)]),
    );

    const title = extractTitleFromYDoc(doc);
    expect(title).toBe(`${longText.slice(0, 70)} …`);
    expect(title!.length).toBe(72); // 70 chars + ' …'
  });

  it('returns null for an empty document', () => {
    const doc = new Y.Doc();
    // Ensure the root XmlText exists but is empty
    doc.get('root', Y.XmlText);

    expect(extractTitleFromYDoc(doc)).toBeNull();
  });

  it('extracts title from h2 heading as first block', () => {
    const doc = createYDocFromEditorState(
      makeEditorState([
        makeHeading('Section Title', 'h2'),
        makeParagraph('Body text'),
      ]),
    );

    expect(extractTitleFromYDoc(doc)).toBe('Section Title');
  });

  it('extracts title from first block containing formatted text', () => {
    const doc = createYDocFromEditorState(
      makeEditorState([
        makeParagraphWithFormatting([
          { text: 'Hello ', format: 0 },
          { text: 'bold', format: 1 },
          { text: ' world', format: 0 },
        ]),
      ]),
    );

    expect(extractTitleFromYDoc(doc)).toBe('Hello bold world');
  });

  it('uses the full editor fixture with h1', () => {
    // This uses the same fixture as the app, ensuring consistency
    // with a real-world Lexical document structure
    const doc = createYDocFromEditorState(
      initialEditorState as SerializedEditorState,
    );

    expect(extractTitleFromYDoc(doc)).toBe('Hello World 👩‍💻');
  });
});
