import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useEffect, useRef } from 'react';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { BLUR_COMMAND, COMMAND_PRIORITY_CRITICAL } from 'lexical';
import { useVirtualKeyboard } from '~/hooks/use-virtual-keyboard';
import { CONTENT_SCROLL_COMMAND } from '../commands/editor-content-scroll';

export const EditorPluginRichText: React.FC = () => {
  const contenteditableRef = useRef<HTMLDivElement>(null);
  const [isVirtualKeyboardOpen] = useVirtualKeyboard();
  const [editor] = useLexicalComposerContext();

  useEffect(
    () => {
      return editor.registerCommand(
        BLUR_COMMAND,
        () => {
          if (!contenteditableRef.current || !isVirtualKeyboardOpen) {
            return false;
          }

          enableBodyScroll(contenteditableRef.current);
          const scrollTop = contenteditableRef.current.scrollTop;
          contenteditableRef.current.style.minHeight = '';
          contenteditableRef.current.style.height = '';
          contenteditableRef.current.scrollTop = 0;
          document.documentElement.scrollTop = scrollTop;

          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      );
    },
    [editor, isVirtualKeyboardOpen],
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

  useEffect(() => {
    if (!contenteditableRef.current || !isVirtualKeyboardOpen) {
      return;
    }

    disableBodyScroll(contenteditableRef.current);
    const scrollTop = document.documentElement.scrollTop;
    const visualHeight = window.visualViewport?.height;
    contenteditableRef.current.style.minHeight = 'auto';
    contenteditableRef.current.style.height = `${visualHeight}px`;
    document.documentElement.scrollTop = 0;
    contenteditableRef.current.scrollTop = scrollTop;
  }, [isVirtualKeyboardOpen]);

  return (
    <RichTextPlugin
      contentEditable={(
        <ContentEditable
          ref={contenteditableRef}
          aria-placeholder="Type something …"
          placeholder={<span />}
          className="pt-15 md:pt-27 pb-3 md:pb-12 w-full min-h-dvh px-4 md:px-[calc((100%-730px)/2)] overflow-y-auto"
        />
      )}
      ErrorBoundary={LexicalErrorBoundary}
    />
  );
};
