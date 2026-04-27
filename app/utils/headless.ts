import { createHeadlessEditor } from '@lexical/headless';
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text';
import { createBinding, syncLexicalUpdateToYjs } from '@lexical/yjs';
import type { Provider, ProviderAwareness } from '@lexical/yjs';
import { $getRoot } from 'lexical';
import { $createTextNode } from 'lexical';
import * as Y from 'yjs';

export function createInitialDocumentContent(): Uint8Array {
  return createHeadlessEditorState(() => {
    const root = $getRoot();
    root.clear();

    const heading = $createHeadingNode('h1');
    heading.append($createTextNode(''));
    root.append(heading);
  });
}

export function createHeadlessEditorState(updateFn: () => void): Uint8Array {
  const ydoc = new Y.Doc();
  const editor = createHeadlessEditor({ nodes: [HeadingNode] });

  const binding = createBinding(editor, emptyProvider, 'root', ydoc, new Map());

  editor.registerUpdateListener(({
    prevEditorState,
    editorState,
    dirtyLeaves,
    dirtyElements,
    normalizedNodes,
    tags,
  }) => {
    syncLexicalUpdateToYjs(
      binding,
      emptyProvider,
      prevEditorState,
      editorState,
      dirtyElements,
      dirtyLeaves,
      normalizedNodes,
      tags,
    );
  });

  editor.update(updateFn, { discrete: true });

  return Y.encodeStateAsUpdate(ydoc);
}

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
