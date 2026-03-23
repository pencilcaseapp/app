import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getSelection, $isRangeSelection, BLUR_COMMAND, COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { useCallback, useEffect, useState } from 'react';
import { $getFormatBlock } from '../utils/node';
import { Button, Toggle, Topbar } from '~/ui';
import type { EditorFormatBlock } from '../editor.types';
import { useWindowScroll } from 'react-use';
import classNames from 'classnames';

export const EditorPluginToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [formatBlock, setFormatBlock] = useState<EditorFormatBlock>('p');
  const [textStyle, setTextFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          setTextFormat({
            bold: selection.hasFormat('bold'),
            italic: selection.hasFormat('italic'),
            underline: selection.hasFormat('underline'),
          });
          setFormatBlock($getFormatBlock(selection));
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    editor.registerCommand(
      BLUR_COMMAND,
      () => {
        setTextFormat({
          bold: false,
          italic: false,
          underline: false,
        });

        setFormatBlock('p');

        window.getSelection()?.removeAllRanges();

        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  const toggleTextStyle = useCallback((style: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, style);
    setTextFormat(prev => ({
      ...prev,
      [style]: !prev[style],
    }));
  }, [editor]);

  const toggleBlock = useCallback((block: EditorFormatBlock) => {
    editor.update(() => {
      const selection = $getSelection();

      if (block === 'p' || !$isRangeSelection(selection)) {
        return;
      }

      const formatBlock = $getFormatBlock(selection);
      if (formatBlock === block) {
        $setBlocksType(selection, () => $createParagraphNode());
        setFormatBlock('p');
      }
      else {
        $setBlocksType(selection, () => $createHeadingNode(block));
        setFormatBlock(block);
      }
    });
  }, [editor]);

  const handleEditorFocus = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const { y } = useWindowScroll();
  const isScrolling = y > 65;

  return (
    <Topbar
      left={<Button color="secondary" icon="sidebar" iconTitle="sidebar" />}
      right={<Button icon="share">Share</Button>}
      center={(
        <div className={classNames('flex gap-2 origin-center transition-all ring-pca-grey-200 bg-pca-white/85 dark:bg-pca-grey-900/80 rounded-2xl px-1.5 py-1.5 mx-1',
          isScrolling && 'lg:shadow-xs lg:ring-1 lg:dark:ring-pca-grey-700 lg:backdrop-blur-md',
        )}
        >
          <div className="flex gap-4 md:gap-2">
            <Toggle className="h-8!" isActive={formatBlock === 'h1'} onMouseDown={handleEditorFocus} onClick={() => toggleBlock('h1')} icon="h1" iconTitle="headline 1" />
            <Toggle className="h-8!" isActive={formatBlock === 'h2'} onMouseDown={handleEditorFocus} onClick={() => toggleBlock('h2')} icon="h2" iconTitle="headline 2" />
            <Toggle className="h-8!" isActive={formatBlock === 'h3'} onMouseDown={handleEditorFocus} onClick={() => toggleBlock('h3')} icon="h3" iconTitle="headline 3" />
          </div>
          <div className="flex gap-4 md:gap-2">
            <Toggle className="h-8!" isActive={textStyle.bold} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('bold')} icon="bold" iconTitle="bold" />
            <Toggle className="h-8!" isActive={textStyle.italic} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('italic')} icon="italic" iconTitle="italic" />
            <Toggle className="h-8!" isActive={textStyle.underline} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('underline')} icon="underline" iconTitle="underline" />
          </div>
          <div className="flex gap-4 md:gap-2">
            <Toggle className="h-8!" disabled isActive={false} icon="listUl" iconTitle="unordered list" />
            <Toggle className="h-8!" disabled isActive={false} icon="listOl" iconTitle="ordered list" />
            <Toggle className="h-8!" disabled isActive={false} icon="listCheck" iconTitle="checklist" />
          </div>
        </div>
      )}
    />
  );
};
