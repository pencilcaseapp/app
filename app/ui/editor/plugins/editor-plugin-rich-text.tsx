import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import classNames from 'classnames';

export interface EditorPluginRichTextProps {
  /** Rendered above the content, taking over the topbar clearance. */
  topArea?: React.ReactNode;
}

/*
 * The page scrolls the content, also while the keyboard is open, and leaves
 * the keyboard to iOS. What makes that smooth is the room below the content
 * on a touch screen, as tall as a keyboard: a caret at the end of the
 * document is never hidden by one, so iOS always has page to reveal it with
 * and to hand back as the keyboard goes, the way Apple Notes does.
 */
export const EditorPluginRichText: React.FC<EditorPluginRichTextProps> = ({
  topArea,
}) => {
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
            aria-placeholder="Type something …"
            placeholder={<span />}
            className={classNames([
              topArea ? 'pt-4 md:pt-6' : 'pt-15 md:pt-27',
              'pb-3 md:pb-12 touch-screen:pb-[55dvh] w-full min-h-dvh px-4 md:px-[calc((100%-730px)/2)]',
            ])}
          />
        )}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </>
  );
};
