import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { BLUR_COMMAND, COMMAND_PRIORITY_CRITICAL } from 'lexical';
import { useMedia } from 'react-use';
import { useReducedMotion } from 'motion/react';
import { useVirtualKeyboard } from '~/hooks/use-virtual-keyboard';
import { listenForEditableTap } from '~/utils/editable-tap';
import { CONTENT_SCROLL_COMMAND } from '../commands/editor-content-scroll';

export interface EditorPluginRichTextProps {
  /** Rendered above the content, taking over the topbar clearance. */
  topArea?: React.ReactNode;
}

/**
 * How far down the page a tapped caret may sit before the keyboard opens.
 * Above the top of the keyboard on every phone held upright, whose keyboard
 * starts at about half the page (54% on an iPhone 17 Pro).
 */
const SAFE_CARET_SHARE = 0.45;

/** How long after the tap the caret has to arrive to be moved. */
const CARET_PLACEMENT_WINDOW = 300;

const CARET_MARGIN = 16;

/*
 * While editing, the content scrolls inside itself, sized to the area above
 * the keyboard, instead of the page scrolling — and `data-editing` gives it
 * the room below to scroll a caret at its end up clear of the keyboard.
 */
const enterEditLayout = (element: HTMLElement) => {
  if ('editing' in element.dataset) {
    return;
  }

  disableBodyScroll(element);
  const scrollTop = document.documentElement.scrollTop;
  element.dataset.editing = '';
  element.style.minHeight = 'auto';
  element.style.height = `${document.documentElement.clientHeight}px`;
  document.documentElement.scrollTop = 0;
  element.scrollTop = scrollTop;
};

const leaveEditLayout = (element: HTMLElement) => {
  enableBodyScroll(element);
  const scrollTop = element.scrollTop;
  delete element.dataset.editing;
  element.style.minHeight = '';
  element.style.height = '';
  element.scrollTop = 0;
  document.documentElement.scrollTop = scrollTop;
};

/** The easing of the drawers, close to the one the keyboard slides in with. */
const ENTER_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
const ENTER_DURATION = 300;

/*
 * Switching the layout blanks the page for the few frames it takes iOS to
 * draw the new scroll area, and the caret moved clear of the keyboard jumps.
 * So the content starts out of sight where it was and fades in on its way
 * to where it is now, alongside the keyboard sliding up. (Fading it out
 * beforehand costs more than it hides: before the switch the content is the
 * whole document, and iOS stalls the page to draw all of it into a layer.)
 */
const animateIntoPlace = (element: HTMLElement, distance: number) => {
  const from = { opacity: 0, transform: `translateY(${distance}px)` };
  element.style.opacity = '0';
  element.style.transform = from.transform;
  // iOS draws the caret itself and leaves it behind where the content was.
  element.style.caretColor = 'transparent';

  requestAnimationFrame(() => {
    const animation = element.animate(
      [from, { opacity: 1, transform: 'translateY(0)' }],
      { duration: ENTER_DURATION, easing: ENTER_EASING },
    );
    element.style.opacity = '';
    element.style.transform = '';

    const showCaret = () => {
      element.style.caretColor = '';
    };
    animation.addEventListener('finish', showCaret);
    animation.addEventListener('cancel', showCaret);
  });
};

const getCaretBottom = () => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) {
    return null;
  }

  const caret = selection.getRangeAt(0).getBoundingClientRect();

  return caret.height > 0 ? caret.bottom : null;
};

/** Scrolls `element` so the caret sits no lower than `bottom`. */
const keepCaretAbove = (element: HTMLElement, bottom: number) => {
  const caretBottom = getCaretBottom();
  if (caretBottom !== null && caretBottom > bottom) {
    element.scrollTop += caretBottom - bottom;
  }
};

export const EditorPluginRichText: React.FC<EditorPluginRichTextProps> = ({
  topArea,
}) => {
  const contenteditableRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)', false);
  const shouldReduceMotion = useReducedMotion();
  const [isVirtualKeyboardOpen] = useVirtualKeyboard();
  const [editor] = useLexicalComposerContext();

  useEffect(
    () => {
      return editor.registerCommand(
        BLUR_COMMAND,
        () => {
          if (
            contenteditableRef.current
            && 'editing' in contenteditableRef.current.dataset
          ) {
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
   * keyboard, and the page cannot know how tall the keyboard will be. So the
   * tap that opens it switches the layout, and a caret it puts low on the
   * page moves up to where no keyboard reaches, which leaves the browser
   * nothing to scroll. Not on the tap itself: the page must not move before
   * the tap has landed, or it lands somewhere else.
   */
  useEffect(() => {
    const element = contenteditableRef.current;
    if (!element || !isTouchDevice) {
      return;
    }

    let placement: ReturnType<typeof setTimeout>;

    const onCaretPlaced = () => {
      document.removeEventListener('selectionchange', onCaretPlaced);
      clearTimeout(placement);
      requestAnimationFrame(() => {
        const before = getCaretBottom();
        enterEditLayout(element);
        const { clientHeight } = document.documentElement;
        keepCaretAbove(element, clientHeight * SAFE_CARET_SHARE);
        const after = getCaretBottom();

        if (!shouldReduceMotion) {
          animateIntoPlace(
            element,
            before !== null && after !== null ? before - after : 0,
          );
        }
      });
    };

    const stopListeningForTaps = listenForEditableTap(element, () => {
      // A tap while the keyboard is open only moves the caret.
      if ('editing' in element.dataset) {
        return;
      }

      document.addEventListener('selectionchange', onCaretPlaced);
      clearTimeout(placement);
      placement = setTimeout(() => {
        document.removeEventListener('selectionchange', onCaretPlaced);
      }, CARET_PLACEMENT_WINDOW);
    });

    // The page has nothing to scroll while editing, yet iOS scrolls it when
    // it reckons the caret sits below the keyboard — in a phone held
    // sideways, say, whose keyboard covers more than the caret was moved
    // clear of.
    const onPageScroll = () => {
      if ('editing' in element.dataset && window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('scroll', onPageScroll, { passive: true });

    return () => {
      stopListeningForTaps();
      window.removeEventListener('scroll', onPageScroll);
      document.removeEventListener('selectionchange', onCaretPlaced);
      clearTimeout(placement);
    };
  }, [isTouchDevice, shouldReduceMotion]);

  // Fitted to the area above the keyboard, and back to the whole page when
  // the keyboard goes away while the content keeps its focus — a hardware
  // keyboard does that.
  useEffect(() => {
    const element = contenteditableRef.current;
    const viewport = window.visualViewport;
    if (!element || !viewport) {
      return;
    }

    if (isVirtualKeyboardOpen) {
      enterEditLayout(element);
    }
    else if (!('editing' in element.dataset)) {
      return;
    }

    element.style.height = `${viewport.height}px`;
    keepCaretAbove(
      element,
      element.getBoundingClientRect().bottom - CARET_MARGIN,
    );
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
              'pb-3 md:pb-12 data-editing:pb-[55dvh] w-full min-h-dvh px-4 md:px-[calc((100%-730px)/2)] overflow-y-auto',
            ])}
          />
        )}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </>
  );
};
