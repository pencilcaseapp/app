import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { BLUR_COMMAND, COMMAND_PRIORITY_CRITICAL } from 'lexical';
import { useVirtualKeyboard } from '~/hooks/use-virtual-keyboard';
import { CONTENT_SCROLL_COMMAND } from '../commands/editor-content-scroll';
import { revealCaret } from '../utils/caret';

/*
 * Where the caret is kept while the keyboard is open: under the topbar with
 * the content's usual clearance, and a line clear of the keyboard — more than
 * the 8px iOS wants to see before it scrolls the caret up on its own.
 */
const CARET_INSET = { top: 60, bottom: 24 };

/*
 * While the keyboard is open the content takes over as the scroller: the
 * page scroll moves into it, it is sized to the visual viewport so it fits
 * between the topbar and the keyboard, and the window stays at the origin,
 * where the fixed topbar is.
 *
 * iOS does not leave it at that. Once the keyboard is up, Safari scrolls its
 * own scroll view to put the caret just above the keyboard. With the caret at
 * the end of a long document that takes the visual viewport past the layout
 * viewport the topbar is fixed to, which carries the topbar off screen and
 * leaves the content hanging over an empty band. The move shows up as a
 * visual viewport scroll, so it is undone by scrolling the window back to the
 * origin, and the caret is revealed inside the content instead — which is all
 * Safari was after. Revealing it right away, before Safari gets there, means
 * Safari mostly finds the caret in place and does not move at all. The height
 * follows the viewport for the same reason: the keyboard changes size after
 * it opened (predictive text, emoji).
 *
 * Returns the release that hands the scroll back to the page.
 */
const lockContentToViewport = (
  element: HTMLElement,
  viewport: VisualViewport,
) => {
  const pageTop = viewport.pageTop;
  disableBodyScroll(element);
  element.style.minHeight = 'auto';
  element.style.height = `${viewport.height}px`;
  document.documentElement.scrollTop = 0;
  element.scrollTop = pageTop;
  revealCaret(element, CARET_INSET);

  const onResize = () => {
    element.style.height = `${viewport.height}px`;
    revealCaret(element, CARET_INSET);
  };

  const onScroll = () => {
    if (viewport.pageTop > 0) {
      document.documentElement.scrollTop = 0;
    }

    revealCaret(element, CARET_INSET);
  };

  viewport.addEventListener('resize', onResize);
  viewport.addEventListener('scroll', onScroll);

  return () => {
    viewport.removeEventListener('resize', onResize);
    viewport.removeEventListener('scroll', onScroll);
    enableBodyScroll(element);
    const scrollTop = element.scrollTop;
    element.style.minHeight = '';
    element.style.height = '';
    element.scrollTop = 0;
    document.documentElement.scrollTop = scrollTop;
  };
};

export interface EditorPluginRichTextProps {
  /** Rendered above the content, taking over the topbar clearance. */
  topArea?: React.ReactNode;
}

export const EditorPluginRichText: React.FC<EditorPluginRichTextProps> = ({
  topArea,
}) => {
  const contenteditableRef = useRef<HTMLDivElement>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const [isVirtualKeyboardOpen] = useVirtualKeyboard();
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const element = contenteditableRef.current;
    const viewport = window.visualViewport;

    if (!element || !viewport || !isVirtualKeyboardOpen) {
      return;
    }

    const release = lockContentToViewport(element, viewport);
    releaseRef.current = release;

    return () => {
      // A blur may already have released it.
      if (releaseRef.current === release) {
        releaseRef.current = null;
        release();
      }
    };
  }, [isVirtualKeyboardOpen]);

  // Leaving the editor closes the keyboard, but the viewport only grows
  // back once the keyboard is gone: release here, so the page has its
  // scroll back before the keyboard starts moving.
  useEffect(() => {
    return editor.registerCommand(
      BLUR_COMMAND,
      () => {
        releaseRef.current?.();
        releaseRef.current = null;

        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    const el = contenteditableRef.current;
    if (!el) return;

    const onScroll = () => {
      editor.dispatchCommand(CONTENT_SCROLL_COMMAND, el.scrollTop);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [editor]);

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
