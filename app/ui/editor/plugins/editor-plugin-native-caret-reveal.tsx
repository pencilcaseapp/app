import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $addUpdateTag,
  COMMAND_PRIORITY_CRITICAL,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  DELETE_CHARACTER_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  mergeRegister,
  SKIP_SCROLL_INTO_VIEW_TAG,
} from 'lexical';
import { useEffect } from 'react';
import { useMedia } from 'react-use';

const skipScrollIntoView = () => {
  $addUpdateTag(SKIP_SCROLL_INTO_VIEW_TAG);
  return false;
};

/**
 * Leaves keeping the caret in sight while typing to iOS.
 *
 * Lexical does it by scrolling the window, which iOS overrides with the
 * keyboard open: it centres the caret instead, a jump of a third of the
 * screen for a single new line. Left to itself, iOS scrolls just as far as
 * the page's `scroll-padding` asks (`app/app.css`), a line at a time, the
 * way Apple Notes does.
 */
export const EditorPluginNativeCaretReveal: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)', false);

  useEffect(() => {
    if (!isTouchDevice) {
      return;
    }

    const priority = COMMAND_PRIORITY_CRITICAL;

    return mergeRegister(
      editor.registerCommand(
        CONTROLLED_TEXT_INSERTION_COMMAND, skipScrollIntoView, priority,
      ),
      editor.registerCommand(
        DELETE_CHARACTER_COMMAND, skipScrollIntoView, priority,
      ),
      editor.registerCommand(
        INSERT_LINE_BREAK_COMMAND, skipScrollIntoView, priority,
      ),
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND, skipScrollIntoView, priority,
      ),
    );
  }, [editor, isTouchDevice]);

  return null;
};
