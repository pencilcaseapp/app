import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { BLUR_COMMAND, COMMAND_PRIORITY_CRITICAL } from 'lexical';
import { useMedia } from 'react-use';
import { useVirtualKeyboard } from '~/hooks/use-virtual-keyboard';
import { CONTENT_SCROLL_COMMAND } from '../commands/editor-content-scroll';

export interface EditorPluginRichTextProps {
  /** Rendered above the content, taking over the topbar clearance. */
  topArea?: React.ReactNode;
}

const KEYBOARD_HEIGHT_KEY = 'pca:keyboard-height';
const KEYBOARD_SETTLE_DELAY = 1000;
const CARET_MARGIN = 16;

const readKeyboardHeight = () => {
  try {
    return Number(localStorage.getItem(KEYBOARD_HEIGHT_KEY)) || 0;
  }
  catch {
    return 0;
  }
};

const storeKeyboardHeight = (height: number) => {
  try {
    localStorage.setItem(KEYBOARD_HEIGHT_KEY, String(Math.round(height)));
  }
  catch {
    // Only a better guess for the next time the keyboard opens.
  }
};

/*
 * While the keyboard is open the content scrolls inside itself, sized to the
 * area above the keyboard, instead of the page scrolling.
 */
const setEditLayoutHeight = (element: HTMLElement, height: number) => {
  if (element.style.height) {
    element.style.height = `${height}px`;
    return;
  }

  disableBodyScroll(element);
  const scrollTop = document.documentElement.scrollTop;
  element.style.minHeight = 'auto';
  element.style.height = `${height}px`;
  document.documentElement.scrollTop = 0;
  element.scrollTop = scrollTop;
};

const leaveEditLayout = (element: HTMLElement) => {
  enableBodyScroll(element);
  const scrollTop = element.scrollTop;
  element.style.minHeight = '';
  element.style.height = '';
  element.scrollTop = 0;
  document.documentElement.scrollTop = scrollTop;
};

const revealCaret = (element: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) {
    return;
  }

  const caret = selection.getRangeAt(0).getBoundingClientRect();
  const overflow = caret.bottom + CARET_MARGIN
    - element.getBoundingClientRect().bottom;
  if (caret.height > 0 && overflow > 0) {
    element.scrollTop += overflow;
  }
};

export const EditorPluginRichText: React.FC<EditorPluginRichTextProps> = ({
  topArea,
}) => {
  const contenteditableRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)', false);
  const [isVirtualKeyboardOpen] = useVirtualKeyboard();
  const [editor] = useLexicalComposerContext();

  useEffect(
    () => {
      return editor.registerCommand(
        BLUR_COMMAND,
        () => {
          if (contenteditableRef.current?.style.height) {
            leaveEditLayout(contenteditableRef.current);
          }

          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      );
    },
    [editor],
  );

  useEffect(() => {
    const el = contenteditableRef.current;
    if (!el) return;

    const onScroll = () => {
      editor.dispatchCommand(CONTENT_SCROLL_COMMAND, el.scrollTop);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [editor]);

  /*
   * Waiting for the keyboard is too late: by the time the viewport shrinks,
   * iOS has already scrolled the page to put the caret right above the
   * keyboard. Switching the layout on focus, sized to the keyboard we saw
   * last, leaves the browser nothing to scroll.
   */
  useEffect(() => {
    const element = contenteditableRef.current;
    if (!element || !isTouchDevice) {
      return;
    }

    let settle: ReturnType<typeof setTimeout>;
    const onFocus = () => {
      const { clientHeight } = document.documentElement;
      setEditLayoutHeight(element, clientHeight - readKeyboardHeight());
      // The caret is placed right after focus.
      requestAnimationFrame(() => revealCaret(element));

      // A hardware keyboard keeps the software one from ever opening.
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (element.style.height && window.visualViewport) {
          setEditLayoutHeight(element, window.visualViewport.height);
        }
      }, KEYBOARD_SETTLE_DELAY);
    };

    element.addEventListener('focus', onFocus);
    return () => {
      element.removeEventListener('focus', onFocus);
      clearTimeout(settle);
    };
  }, [isTouchDevice]);

  useEffect(() => {
    const element = contenteditableRef.current;
    const viewport = window.visualViewport;
    if (!element || !viewport || !isVirtualKeyboardOpen) {
      return;
    }

    storeKeyboardHeight(
      document.documentElement.clientHeight - viewport.height,
    );
    setEditLayoutHeight(element, viewport.height);
    revealCaret(element);
  }, [isVirtualKeyboardOpen]);

  return (
    <>
      {topArea && (
        <div className="pt-15 md:pt-27 px-4 md:px-[calc((100%-730px)/2)]">
          {topArea}
        </div>
      )}
      <RichTextPlugin
        contentEditable={(
          <ContentEditable
            ref={contenteditableRef}
            aria-placeholder="Type something …"
            placeholder={<span />}
            className={classNames([
              topArea ? 'pt-4 md:pt-6' : 'pt-15 md:pt-27',
              'pb-3 md:pb-12 w-full min-h-dvh px-4 md:px-[calc((100%-730px)/2)] overflow-y-auto',
            ])}
          />
        )}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </>
  );
};
