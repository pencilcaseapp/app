import { withDOM } from '@lexical/headless/dom';
import {
  createBinding,
  syncYjsChangesToLexical,
  type Provider,
  type ProviderAwareness,
} from '@lexical/yjs';
import { $nodesOfType, createEditor } from 'lexical';
import * as Y from 'yjs';
import { EDITOR_NODES } from '~/ui/editor/editor-nodes';
import editorTheme from '~/ui/editor/editor-theme';
import { ImageNode } from '~/ui/editor/nodes/image-node';

/**
 * The document's content as the editor draws it, for the page to show
 * before the live connection has synced. It goes through the editor's own
 * DOM rendering rather than Lexical's HTML export, so the markup and the
 * classes are the ones the editor puts in their place. Only the images,
 * which React draws, come from their node's `exportDOM`.
 */
export function renderDocumentPreview(content: Uint8Array): string {
  return withDOM((window) => {
    const doc = new Y.Doc();
    const editor = createEditor({
      namespace: 'pencilCase',
      nodes: EDITOR_NODES,
      theme: editorTheme,
      onError: (error) => {
        throw error;
      },
    });
    const root = window.document.createElement('div');
    editor.setRootElement(root);

    const binding = createBinding(editor, emptyProvider, 'root', doc, new Map());
    binding.root.getSharedType().observeDeep((events) => {
      syncYjsChangesToLexical(binding, emptyProvider, events, false);
    });
    Y.applyUpdate(doc, content);
    // The Yjs changes are applied in an update of their own, which only
    // commits in a microtask; this one commits it right away.
    editor.update(() => {}, { discrete: true });

    // An image is drawn by React into the box the editor leaves for it.
    editor.getEditorState().read(() => {
      for (const node of $nodesOfType(ImageNode)) {
        const { element } = node.exportDOM();

        if (element) {
          editor.getElementByKey(node.getKey())?.append(element);
        }
      }
    });

    const html = root.innerHTML;
    editor.setRootElement(null);
    doc.destroy();

    return html;
  });
}

const emptyProvider: Provider = {
  awareness: {
    getStates: () => new Map(),
    getLocalState: () => null,
  } as unknown as ProviderAwareness,
  connect: () => {},
  disconnect: () => {},
  on: () => {},
  off: () => {},
};
