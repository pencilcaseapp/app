import { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { listenForEditableTap } from '~/utils/editable-tap';

const KEYBOARD_HEIGHT_THRESHOLD = 50;

/** How long iOS may take to bring the keyboard back to a returning page. */
const KEYBOARD_RETURN_WINDOW = 1000;

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
  const [visibleHeight, setVisibleHeight] = useState(0);

  useEffect(() => {
    if (!isTouchDevice) {
      return;
    }

    // Nor is a shrinking viewport with the content focused: the spinner of
    // a pull-to-refresh shrinks it as well, and a focus the page moved there
    // itself opens no keyboard. Only a tap on the content does.
    let tapped = false;

    // iOS and Chrome leave the page its height and only shrink the visual
    // viewport, but the Android web view shrinks the page along with it, so
    // the height the page had before is what the keyboard is measured
    // against; per width, as turning the phone changes it. While the page
    // shrinks, Android takes the keyboard off the visual viewport a second
    // time for a moment, so there the page is what is left above it.
    const fullHeights = new Map<number, number>();
    const getFullHeight = () => {
      const { clientWidth, clientHeight } = document.documentElement;
      const height = Math.max(clientHeight, fullHeights.get(clientWidth) ?? 0);
      fullHeights.set(clientWidth, height);

      return height;
    };
    getFullHeight();

    // Switching apps or locking the phone takes the keyboard away with the
    // page, and iOS brings it back a moment after the page returns; the
    // viewport it reports in between is not the reader closing it.
    let returning: ReturnType<typeof setTimeout> | undefined;

    const listener = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        return;
      }

      const { clientHeight } = document.documentElement;
      const fullHeight = getFullHeight();
      const height = clientHeight < fullHeight ? clientHeight : viewport.height;
      const open = tapped
        && fullHeight - height > KEYBOARD_HEIGHT_THRESHOLD
        && hasEditableFocus();

      const away = document.visibilityState === 'hidden'
        || returning !== undefined;
      if (away && !open) {
        return;
      }

      clearTimeout(returning);
      returning = undefined;
      setIsOpen(open);
      if (open) {
        setVisibleHeight(height);
      }
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
    const onVisibilityChange = () => {
      clearTimeout(returning);
      returning = undefined;
      if (document.visibilityState === 'visible') {
        returning = setTimeout(() => {
          returning = undefined;
          listener();
        }, KEYBOARD_RETURN_WINDOW);
      }
    };
    window.addEventListener('focusin', listener);
    window.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(returning);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopListeningForTaps();
      window.visualViewport?.removeEventListener('resize', listener);
      window.removeEventListener('focusin', listener);
      window.removeEventListener('focusout', onFocusOut);
    };
  }, [isTouchDevice]);

  return [isOpen, visibleHeight] as const;
};
