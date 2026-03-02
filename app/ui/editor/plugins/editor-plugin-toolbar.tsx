import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getSelection, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { useCallback, useEffect, useState } from 'react';
import { $getFormatBlock } from '../utils/node';
import { Toggle } from '~/ui';
import type { EditorFormatBlock } from '../editor.types';

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

  return (
    <div className="flex gap-2 my-2">
      <Toggle isActive={formatBlock === 'h1'} onClick={() => toggleBlock('h1')}>
        H1
      </Toggle>
      <Toggle isActive={formatBlock === 'h2'} onClick={() => toggleBlock('h2')}>
        H2
      </Toggle>
      <Toggle isActive={formatBlock === 'h3'} onClick={() => toggleBlock('h3')}>
        H3
      </Toggle>
      <Toggle isActive={textStyle.bold} onClick={() => toggleTextStyle('bold')}>
        B
      </Toggle>
      <Toggle isActive={textStyle.italic} onClick={() => toggleTextStyle('italic')}>
        I
      </Toggle>
      <Toggle isActive={textStyle.underline} onClick={() => toggleTextStyle('underline')}>
        U
      </Toggle>
    </div>
  );
};
