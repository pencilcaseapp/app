import { useEffect, useState } from 'react';
import { useMedia } from 'react-use';

const KEYBOARD_HEIGHT_THRESHOLD = 50;

/*
 * A shrinking viewport is not proof of our own keyboard: iOS resizes the page
 * behind the native share sheet when the app it hands the link to opens a
 * keyboard of its own, and the page never sees it close again. Only an
 * editable element focused in this document can have opened the keyboard the
 * editor has to lay itself out around.
 */
const hasEditableFocus = () => {
  const element = document.activeElement;

  return element instanceof HTMLElement
    && (element.isContentEditable
      || element instanceof HTMLInputElement
      || element instanceof HTMLTextAreaElement);
};

export const useVirtualKeyboard = () => {
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isTouchDevice) {
      return;
    }

    const listener = () => {
      const viewport = window.visualViewport;

      setIsOpen(
        !!viewport
        && window.innerHeight - viewport.height > KEYBOARD_HEIGHT_THRESHOLD
        && hasEditableFocus(),
      );
    };

    window.visualViewport?.addEventListener('resize', listener);
    // Focus moves before the viewport settles, and on the way out of the app
    // it is the only thing that moves at all.
    window.addEventListener('focusin', listener);
    window.addEventListener('focusout', listener);

    return () => {
      window.visualViewport?.removeEventListener('resize', listener);
      window.removeEventListener('focusin', listener);
      window.removeEventListener('focusout', listener);
    };
  }, [isTouchDevice]);

  return [isOpen];
};
