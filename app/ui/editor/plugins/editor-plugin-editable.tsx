import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

export interface EditorPluginEditableProps {
  editable: boolean;
}

/**
 * Keeps Lexical's editable state in sync with the prop; the composer only
 * reads it once at creation.
 */
export const EditorPluginEditable: React.FC<EditorPluginEditableProps> = ({
  editable,
}) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.setEditable(editable);
  }, [editor, editable]);

  return null;
};
