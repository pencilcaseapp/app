import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { useEffect, useRef } from 'react';

export const EditorPluginFocusEmpty: React.FC = () => {
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

      editor.update(() => {
        const root = $getRoot();
        const firstNode = root.getFirstChild();

        if ($isHeadingNode(firstNode)) {
          firstNode.selectEnd();
        }
      }, { discrete: true });

      editor.focus();
    };

    maybeFocusEmptyDocument();

    return editor.registerUpdateListener(() => {
      maybeFocusEmptyDocument();
    });
  }, [editor]);

  return null;
};
