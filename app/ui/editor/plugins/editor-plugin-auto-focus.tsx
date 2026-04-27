import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { useEffect, useRef } from 'react';

export const EditorPluginAutoFocus: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const hasAutoFocusedRef = useRef(false);

  useEffect(() => {
    const maybeFocusEmptyDocument = () => {
      if (hasAutoFocusedRef.current) {
        return;
      }

      const shouldFocus = editor.getEditorState().read(() => {
        const root = $getRoot();
        if (root.getChildrenSize() !== 1) {
          return false;
        }

        const firstNode = root.getFirstChild();
        if (!$isHeadingNode(firstNode)) {
          return false;
        }

        return firstNode.getTag() === 'h1' && firstNode.getTextContent().trim() === '';
      });

      if (!shouldFocus) {
        return;
      }

      hasAutoFocusedRef.current = true;

      editor.focus(
        () => {
          const activeElement = document.activeElement;
          const rootElement = editor.getRootElement() as HTMLDivElement;
          if (
            rootElement !== null
            && (activeElement === null || !rootElement.contains(activeElement))
          ) {
            rootElement.focus({ preventScroll: true });
          }
        },
        { defaultSelection: 'rootEnd' },
      );
    };

    maybeFocusEmptyDocument();

    return editor.registerUpdateListener(() => {
      maybeFocusEmptyDocument();
    });
  }, [editor]);

  return null;
};
