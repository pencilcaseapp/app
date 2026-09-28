import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useEffect, useRef } from 'react';
import classNames from 'classnames';
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
  /**
   * Laid over the content and scrolled along with it — for things placed
   * against the text, like the cursors of the other people in it.
   */
  contentOverlay?: React.ReactNode;
}

/**
 * Where a tapped line glides to as the keyboard opens, wherever it was
 * tapped: a third of the way down the page, well above the top of the
 * keyboard on every phone held upright (about half the page, 54% on an
 * iPhone 17 Pro).
 */
const READING_POSITION_SHARE = 1 / 3;

/** A move this small is left alone rather than animated. */
const MIN_GLIDE = 4;

/** How long after the tap the caret has to arrive to be moved. */
const CARET_PLACEMENT_WINDOW = 300;

const CARET_MARGIN = 16;

/** How long the keyboard takes to slide in. */
const KEYBOARD_SLIDE_DURATION = 350;

/** How long the keyboard takes to come up after the tap. */
const KEYBOARD_REVEAL_DURATION = 600;

/** How long after the keyboard goes iOS may still scroll the page back. */
const KEYBOARD_RESTORE_WINDOW = 700;

/*
 * While editing, the content scrolls in the element around it, sized to the
 * area above the keyboard, instead of the page scrolling. Not in the content
 * itself: iOS places a tap in an editable element that is scrolled as if it
 * were not, so a double tap selected from the start of the document. The page
 * stays where it is, the element pushed down to where the page shows it, so
 * nothing on screen moves as the scrolling changes hands.
 */
const enterEditLayout = (frame: HTMLElement, element: HTMLElement) => {
  if ('editing' in element.dataset) {
    return;
  }

  const scrollTop = document.documentElement.scrollTop;
  const { clientHeight } = document.documentElement;
  frame.style.paddingTop = `${scrollTop}px`;
  // Tall enough for the page to stay put with the browser bar collapsed.
  frame.style.height = `${scrollTop + Math.max(clientHeight, innerHeight)}px`;
  element.dataset.editing = '';
  element.style.minHeight = 'auto';
  element.style.height = `${clientHeight}px`;
  element.scrollTop = scrollTop;
};

/** Where the page stays while editing. */
const getFrozenTop = (frame: HTMLElement) => parseFloat(frame.style.paddingTop);

/*
 * The page takes over at the very offset the content had, so nothing moves
 * as the keyboard goes — which the room below the content always leaves the
 * page enough of.
 */
const leaveEditLayout = (frame: HTMLElement, element: HTMLElement) => {
  const scrollTop = element.scrollTop;
  frame.style.paddingTop = '';
  frame.style.height = '';
  delete element.dataset.editing;
  element.style.minHeight = '';
  element.style.height = '';
  element.scrollTop = 0;
  document.documentElement.scrollTop = scrollTop;

  return scrollTop;
};

/** The easing of the drawers, close to the one the keyboard slides in with. */
const ENTER_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';

/*
 * The tapped line glides to the reading position alongside the keyboard
 * sliding up, slowing down gently rather than covering most of the distance
 * in its first frames.
 */
const GLIDE = { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };

const glideIntoPlace = (element: HTMLElement, distance: number) => {
  element.style.transform = `translateY(${distance}px)`;
  // iOS draws the caret itself and leaves it behind where the content was.
  element.style.caretColor = 'transparent';

  requestAnimationFrame(() => {
    const glide = element.animate(
      [
        { transform: `translateY(${distance}px)` },
        { transform: 'translateY(0)' },
      ],
      GLIDE,
    );
    element.style.transform = '';

    const showCaret = () => {
      element.style.caretColor = '';
    };
    glide.addEventListener('finish', showCaret);
    glide.addEventListener('cancel', showCaret);
  });
};

/*
 * As the keyboard comes up, iOS scrolls the page to line the caret up with
 * the top of the keyboard, up or down, wherever the caret is — unless the
 * element being edited counts as hidden, which one without a height of its
 * own does, even with its text showing. So while the keyboard comes up, the
 * element collapses and the content around it keeps its size and the text
 * its place.
 */
const hideFromKeyboard = (content: HTMLElement) => {
  const editable = content.firstElementChild;
  if (!(editable instanceof HTMLElement)) {
    return () => {};
  }

  content.style.height = `${content.offsetHeight}px`;
  content.style.paddingTop = getComputedStyle(editable).paddingTop;
  editable.style.paddingBlock = '0';
  editable.style.minHeight = '0';
  editable.style.height = '0';

  return () => {
    content.style.height = '';
    content.style.paddingTop = '';
    editable.style.paddingBlock = '';
    editable.style.minHeight = '';
    editable.style.height = '';
  };
};

/**
 * Where the caret ends up once the content has slid into place: while it is
 * sliding, the caret moves along with it.
 */
const getCaretBottom = (content?: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) {
    return null;
  }

  let caret = selection.getRangeAt(0).getBoundingClientRect();
  // On an empty line the caret has no box of its own; the line has.
  if (caret.height === 0) {
    const node = selection.anchorNode;
    const line = node instanceof Element ? node : node?.parentElement;
    if (line) {
      caret = line.getBoundingClientRect();
    }
  }
  const slide = content
    ? new DOMMatrix(getComputedStyle(content).transform).m42
    : 0;

  return caret.height > 0 ? caret.bottom - slide : null;
};

/** Scrolls `element` so the caret in `content` sits at `bottom`. */
const moveCaretTo = (
  element: HTMLElement,
  content: HTMLElement,
  bottom: number,
) => {
  const caretBottom = getCaretBottom(content);
  if (caretBottom !== null) {
    element.scrollTop += caretBottom - bottom;
  }
};

/**
 * Scrolls `element` so the caret in `content` sits no lower than `bottom`,
 * and tells how far it scrolled.
 */
const keepCaretAbove = (
  element: HTMLElement,
  content: HTMLElement,
  bottom: number,
) => {
  const caretBottom = getCaretBottom(content);
  if (caretBottom === null || caretBottom <= bottom) {
    return 0;
  }

  const scrollTop = element.scrollTop;
  element.scrollTop += caretBottom - bottom;

  return element.scrollTop - scrollTop;
};

export const EditorPluginRichText: React.FC<EditorPluginRichTextProps> = ({
  topArea,
  contentOverlay,
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  // The content and what is laid over it, which move together.
  const canvasRef = useRef<HTMLDivElement>(null);
  // Where editing left the page, and until when it is held there.
  const leftRef = useRef({ top: 0, until: 0 });
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)', false);
  const shouldReduceMotion = useReducedMotion();
  const [isVirtualKeyboardOpen] = useVirtualKeyboard();
  const [editor] = useLexicalComposerContext();

  useEffect(
    () => {
      return editor.registerCommand(
        BLUR_COMMAND,
        () => {
          const frame = frameRef.current;
          const scroller = scrollerRef.current;
          if (frame && scroller && 'editing' in scroller.dataset) {
            leftRef.current = {
              top: leaveEditLayout(frame, scroller),
              until: performance.now() + KEYBOARD_RESTORE_WINDOW,
            };
          }

          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      );
    },
    [editor],
  );

  useEffect(() => {
    const el = scrollerRef.current;
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
   * tap that opens it switches the layout, and the tapped line moves to the
   * reading position, where no keyboard reaches, which leaves the browser
   * nothing to scroll — wherever the tap was, so it feels the same every
   * time. Not on the tap itself: the page must not move before the tap has
   * landed, or it lands somewhere else.
   */
  useEffect(() => {
    const frame = frameRef.current;
    const element = scrollerRef.current;
    const content = canvasRef.current;
    if (!frame || !element || !content || !isTouchDevice) {
      return;
    }

    let placement: ReturnType<typeof setTimeout>;
    let reveal: ReturnType<typeof setTimeout>;
    let showToKeyboard = () => {};

    const onCaretPlaced = () => {
      document.removeEventListener('selectionchange', onCaretPlaced);
      clearTimeout(placement);
      requestAnimationFrame(() => {
        const before = getCaretBottom();
        enterEditLayout(frame, element);
        showToKeyboard = hideFromKeyboard(content);
        reveal = setTimeout(showToKeyboard, KEYBOARD_REVEAL_DURATION);
        const { clientHeight } = document.documentElement;
        moveCaretTo(
          element,
          content,
          clientHeight * READING_POSITION_SHARE,
        );
        const after = getCaretBottom();

        // Up or down; a line at the very start of the document cannot move
        // down, and one that already sits there does not move at all.
        const distance = before !== null && after !== null ? before - after : 0;
        if (!shouldReduceMotion && Math.abs(distance) >= MIN_GLIDE) {
          glideIntoPlace(content, distance);
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

    // The page stays put while editing, yet iOS scrolls it when it reckons
    // the caret sits below the keyboard — in a phone held sideways, say,
    // whose keyboard covers more than the caret was moved clear of.
    const onPageScroll = () => {
      if ('editing' in element.dataset) {
        const top = getFrozenTop(frame);
        if (Math.round(window.scrollY) !== Math.round(top)) {
          window.scrollTo(0, top);
        }
        return;
      }

      // With the keyboard gone, iOS scrolls the page back to where it was
      // before the keyboard came up, which would drop the text the reader
      // just edited; it stays where editing left it.
      const left = leftRef.current;
      if (performance.now() < left.until) {
        if (Math.round(window.scrollY) !== left.top) {
          window.scrollTo(0, left.top);
        }
      }
    };

    // A reader who starts scrolling is not held.
    const onTouchStart = () => {
      leftRef.current.until = 0;
    };

    window.addEventListener('scroll', onPageScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    return () => {
      stopListeningForTaps();
      window.removeEventListener('scroll', onPageScroll);
      window.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('selectionchange', onCaretPlaced);
      clearTimeout(placement);
      clearTimeout(reveal);
      showToKeyboard();
    };
  }, [isTouchDevice, shouldReduceMotion]);

  // Fitted to the area above the keyboard, and back to the whole page when
  // the keyboard goes away while the content keeps its focus — a hardware
  // keyboard does that. The viewport reports the keyboard as soon as it
  // starts to slide in, so the area follows it up rather than giving up the
  // content below in one go: cut off right away, it vanishes in front of the
  // keyboard; cut off once the keyboard is in, it vanishes behind the
  // translucent bar above it.
  useEffect(() => {
    const frame = frameRef.current;
    const element = scrollerRef.current;
    const content = canvasRef.current;
    const viewport = window.visualViewport;
    if (!frame || !element || !content || !viewport) {
      return;
    }

    if (isVirtualKeyboardOpen) {
      enterEditLayout(frame, element);
    }
    else if (!('editing' in element.dataset)) {
      return;
    }

    const bottom = element.getBoundingClientRect().top + viewport.height;
    keepCaretAbove(element, content, bottom - CARET_MARGIN);

    if (!isVirtualKeyboardOpen || shouldReduceMotion) {
      element.style.height = `${viewport.height}px`;
      return;
    }

    const follow = element.animate(
      [{ height: element.style.height }, { height: `${viewport.height}px` }],
      { duration: KEYBOARD_SLIDE_DURATION, easing: ENTER_EASING },
    );
    element.style.height = `${viewport.height}px`;

    return () => follow.cancel();
  }, [isVirtualKeyboardOpen, shouldReduceMotion]);

  return (
    <>
      {topArea && (
        <div className="pt-15 md:pt-27 px-4 md:px-[calc((100%-730px)/2)]">
          {topArea}
        </div>
      )}
      <RichTextPlugin
        contentEditable={(
          <div ref={frameRef}>
            <div
              ref={scrollerRef}
              className="group/scroller data-editing:overflow-y-auto data-editing:overscroll-y-contain"
            >
              <div ref={canvasRef} className="relative">
                <ContentEditable
                  aria-placeholder="Type something …"
                  placeholder={<span />}
                  className={classNames([
                    topArea ? 'pt-4 md:pt-6' : 'pt-15 md:pt-27',
                    'pb-3 md:pb-12 touch-screen:pb-[55dvh] w-full min-h-dvh px-4 md:px-[calc((100%-730px)/2)]',
                  ])}
                />
                {contentOverlay}
              </div>
            </div>
          </div>
        )}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </>
  );
};
