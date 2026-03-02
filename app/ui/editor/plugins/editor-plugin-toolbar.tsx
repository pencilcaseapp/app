import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getSelection, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { useCallback, useEffect, useState } from 'react';
import { $findTopLevelElement } from '../utils/node';
import { Toggle } from '~/ui';

type TextStyle = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';

export const EditorPluginToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textStyle, setTextStyle] = useState<TextStyle>('p');

  useEffect(() => {
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'));
          setIsItalic(selection.hasFormat('italic'));
          setIsUnderline(selection.hasFormat('underline'));

          const anchorNode = selection.anchor.getNode();
          const element = $findTopLevelElement(anchorNode);

          if ($isHeadingNode(element)) {
            const tag = element.getTag();
            setTextStyle(tag);
          }
          else {
            setTextStyle('p');
          }
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  const handleTextFormat = useCallback((format: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);

    switch (format) {
      case 'bold':{
        setIsBold(prev => !prev);
        break;
      }

      case 'italic': {
        setIsItalic(prev => !prev);
        break;
      }

      case 'underline': {
        setIsUnderline(prev => !prev);
        break;
      }
    }
  }, [editor]);

  const handleTextStyle = useCallback((style: TextStyle) => {
    editor.update(() => {
      const selection = $getSelection();

      if (style === 'p' || !$isRangeSelection(selection)) {
        return;
      }

      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);

      if ($isHeadingNode(element) && element.getTag() === style) {
        $setBlocksType(selection, () => $createParagraphNode());
        setTextStyle('p');
      }
      else {
        $setBlocksType(selection, () => $createHeadingNode(style));
        setTextStyle(style);
      }
    });
  }, [editor]);

  return (
    <div className="flex gap-2 my-2">
      <Toggle isActive={textStyle === 'h1'} onClick={() => handleTextStyle('h1')}>
        H1
      </Toggle>
      <Toggle isActive={textStyle === 'h2'} onClick={() => handleTextStyle('h2')}>
        H2
      </Toggle>
      <Toggle isActive={textStyle === 'h3'} onClick={() => handleTextStyle('h3')}>
        H3
      </Toggle>
      <Toggle isActive={isBold} onClick={() => handleTextFormat('bold')}>
        Bold
      </Toggle>
      <Toggle isActive={isItalic} onClick={() => handleTextFormat('italic')}>
        Italic
      </Toggle>
      <Toggle isActive={isUnderline} onClick={() => handleTextFormat('underline')}>
        Underline
      </Toggle>
    </div>
  );
};
