import { useEffect } from 'react';
import { useMedia } from 'react-use';

const opensKeyboard = (element: Element | null): element is HTMLElement =>
  element instanceof HTMLElement
  && (element.isContentEditable || element.matches('input, textarea'));

/**
 * Lets go of the field being typed in when the page goes to the background
 * (another app, the lock screen, closing the app), so the keyboard closes
 * with it: iOS brings it back with the page otherwise, in a state neither
 * the page nor the keyboard agree on. Not on a desktop, where switching tabs
 * keeps the caret where it was and nothing goes wrong.
 */
export const useBlurInBackground = () => {
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)', false);

  useEffect(() => {
    if (!isTouchDevice) {
      return;
    }

    const onVisibilityChange = () => {
      const element = document.activeElement;
      if (document.visibilityState === 'hidden' && opensKeyboard(element)) {
        element.blur();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isTouchDevice]);
};
