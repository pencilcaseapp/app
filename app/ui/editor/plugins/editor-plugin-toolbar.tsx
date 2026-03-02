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
  const [textFormat, setTextFormat] = useState({
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

  const handleTextFormat = useCallback((format: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    setTextFormat(prev => ({
      ...prev,
      [format]: !prev[format],
    }));
  }, [editor]);

  const handleTextStyle = useCallback((style: EditorFormatBlock) => {
    editor.update(() => {
      const selection = $getSelection();

      if (style === 'p' || !$isRangeSelection(selection)) {
        return;
      }

      const formatBlock = $getFormatBlock(selection);
      if (formatBlock === style) {
        $setBlocksType(selection, () => $createParagraphNode());
        setFormatBlock('p');
      }
      else {
        $setBlocksType(selection, () => $createHeadingNode(style));
        setFormatBlock(style);
      }
    });
  }, [editor]);

  return (
    <div className="flex gap-2 my-2">
      <Toggle isActive={formatBlock === 'h1'} onClick={() => handleTextStyle('h1')}>
        H1
      </Toggle>
      <Toggle isActive={formatBlock === 'h2'} onClick={() => handleTextStyle('h2')}>
        H2
      </Toggle>
      <Toggle isActive={formatBlock === 'h3'} onClick={() => handleTextStyle('h3')}>
        H3
      </Toggle>
      <Toggle isActive={textFormat.bold} onClick={() => handleTextFormat('bold')}>
        B
      </Toggle>
      <Toggle isActive={textFormat.italic} onClick={() => handleTextFormat('italic')}>
        I
      </Toggle>
      <Toggle isActive={textFormat.underline} onClick={() => handleTextFormat('underline')}>
        U
      </Toggle>
    </div>
  );
};
