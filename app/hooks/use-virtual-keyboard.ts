import { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { listenForEditableTap } from '~/utils/editable-tap';

const KEYBOARD_HEIGHT_THRESHOLD = 50;

/*
 * A shrinking viewport is not proof of our own keyboard: iOS resizes the page
 * behind the native share sheet when the app it hands the link to opens a
 * keyboard of its own, and the page never sees it close again. Only the
 * editor's own content can have opened the keyboard it has to lay itself out
 * around — a form field in a dialog or drawer above it opens a keyboard the
 * editor must stay out of the way of, not one it should reflow for.
 */
const hasEditableFocus = () => {
  const element = document.activeElement;

  return element instanceof HTMLElement && element.isContentEditable;
};

export const useVirtualKeyboard = () => {
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isTouchDevice) {
      return;
    }

    // Nor is a shrinking viewport with the content focused: the spinner of
    // a pull-to-refresh shrinks it as well, and a focus the page moved there
    // itself opens no keyboard. Only a tap on the content does.
    let tapped = false;

    const listener = () => {
      const viewport = window.visualViewport;

      setIsOpen(
        tapped
        && !!viewport
        && document.documentElement.clientHeight - viewport.height
        > KEYBOARD_HEIGHT_THRESHOLD
        && hasEditableFocus(),
      );
    };

    const stopListeningForTaps = listenForEditableTap(window, () => {
      tapped = true;
      listener();
    });
    window.visualViewport?.addEventListener('resize', listener);
    // Focus moves before the viewport settles, and on the way out of the app
    // it is the only thing that moves at all.
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;

      if (!(next instanceof HTMLElement && next.isContentEditable)) {
        tapped = false;
      }

      listener();
    };
    window.addEventListener('focusin', listener);
    window.addEventListener('focusout', onFocusOut);

    return () => {
      stopListeningForTaps();
      window.visualViewport?.removeEventListener('resize', listener);
      window.removeEventListener('focusin', listener);
      window.removeEventListener('focusout', onFocusOut);
    };
  }, [isTouchDevice]);

  return [isOpen];
};
