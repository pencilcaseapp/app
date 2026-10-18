import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { useMedia } from 'react-use';

/**
 * Lexical's check list, minus the focus it hands the list items on touch
 * devices.
 *
 * Ticking a box is not editing: the check list plugin focuses the list item
 * it toggled, and a focused item inside the contenteditable is what opens
 * the virtual keyboard, which covers half the document nobody asked to edit.
 *
 * Lexical also makes every leaf check item focusable (`tabindex="-1"`, so
 * space and the arrow keys can work the box), which means a tap on the
 * item's text first moves the focus from the editor root onto the item. The
 * root blurs — which the keyboard layout reads as the keyboard closing and
 * scrolls the document back to the top — and iOS drops the caret over the
 * focus change instead of placing it under the finger. Touch has no keys
 * to serve, so there the items stay unfocusable and a tap lands the caret
 * like it does in any other block.
 */
export const EditorPluginCheckList: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)', false);

  useEffect(() => {
    if (!isTouchDevice) {
      return;
    }

    // Lexical sets the attribute again whenever it reconciles an item, which
    // includes every change to the text inside it, so it has to go after
    // each update, not just when the item itself changes.
    const removeTabIndex = () => {
      editor.getRootElement()?.querySelectorAll('li[tabindex]')
        .forEach(item => item.removeAttribute('tabindex'));
    };

    removeTabIndex();
    return editor.registerUpdateListener(removeTabIndex);
  }, [editor, isTouchDevice]);

  return <CheckListPlugin disableTakeFocusOnClick={isTouchDevice} />;
};
