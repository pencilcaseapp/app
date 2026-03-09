import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getSelection, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { useCallback, useEffect, useRef, useState } from 'react';
import { $getFormatBlock } from '../utils/node';
import { Toggle } from '~/ui';
import type { EditorFormatBlock } from '../editor.types';

export const EditorPluginToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const toolbar = useRef<HTMLDivElement>(null);
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

  return (
    <div
      ref={toolbar}
      className="w-full h-12 md:h-15 fixed left-0 top-0 z-50 flex bg-white dark:bg-pca-grey-900 justify-center items-center"
    >
      <div className="flex gap-2">
        <Toggle isActive={formatBlock === 'h1'} onMouseDown={handleEditorFocus} onClick={() => toggleBlock('h1')} icon="h1" iconTitle="headline 1" />
        <Toggle isActive={formatBlock === 'h2'} onMouseDown={handleEditorFocus} onClick={() => toggleBlock('h2')} icon="h2" iconTitle="headline 2" />
        <Toggle isActive={formatBlock === 'h3'} onMouseDown={handleEditorFocus} onClick={() => toggleBlock('h3')} icon="h3" iconTitle="headline 3" />
        <Toggle isActive={textStyle.bold} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('bold')} icon="bold" iconTitle="bold" />
        <Toggle isActive={textStyle.italic} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('italic')} icon="italic" iconTitle="italic" />
        <Toggle isActive={textStyle.underline} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('underline')} icon="underline" iconTitle="underline" />
      </div>
    </div>
  );
};
