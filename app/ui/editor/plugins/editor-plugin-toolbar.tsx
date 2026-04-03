import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getSelection, $isRangeSelection, BLUR_COMMAND, COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { useCallback, useEffect, useRef, useState } from 'react';
import { $getFormatBlock } from '../utils/node';
import { Button, Topbar, Toolbar, ToolbarGroup, ToolbarToggle, ToolbarSeparator } from '~/ui';
import type { EditorFormatBlock } from '../editor.types';
import { useMedia, useWindowScroll } from 'react-use';
import { useVirtualKeyboard } from '~/hooks/use-virtual-keyboard';

export const EditorPluginToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [formatBlock, setFormatBlock] = useState<EditorFormatBlock>('p');
  const [textStyle, setTextFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  const topbarRef = useRef<HTMLElement>(null);
  const [isVirtualKeyboardOpen] = useVirtualKeyboard();

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
        if (!topbarRef.current) {
          return false;
        }
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

  useEffect(() => {
    if (!topbarRef.current || !isVirtualKeyboardOpen) {
      return;
    }
  }, [isVirtualKeyboardOpen]);

  const handleEditorFocus = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const isWide = useMedia('(min-width: 1024px)');
  const { y: windowY } = useWindowScroll();

  const isScrolling = windowY > 65;

  return (
    <Topbar
      ref={topbarRef}
      hasBorder={isVirtualKeyboardOpen}
      left={!isVirtualKeyboardOpen ? <Button color="secondary" icon="sidebar" iconTitle="sidebar" /> : <Button color="secondary" icon="close" className="text-pca-grey-400!" iconTitle="close" />}
      right={!isVirtualKeyboardOpen && (<Button icon="share" color="upgrade">Share</Button>)}
      center={(
        (isWide || isVirtualKeyboardOpen) && (
          <Toolbar isScrolling={isScrolling}>
            <ToolbarGroup>
              <ToolbarToggle isActive={formatBlock === 'h1'} onMouseDown={handleEditorFocus} onClick={() => toggleBlock('h1')} icon="h1" tooltipLabel="Heading 1" />
              <ToolbarToggle isActive={formatBlock === 'h2'} onMouseDown={handleEditorFocus} onClick={() => toggleBlock('h2')} icon="h2" tooltipLabel="Heading 2" />
              <ToolbarToggle isActive={formatBlock === 'h3'} onMouseDown={handleEditorFocus} onClick={() => toggleBlock('h3')} icon="h3" tooltipLabel="Heading 3" />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <ToolbarToggle isActive={textStyle.bold} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('bold')} icon="bold" tooltipLabel="Bold" />
              <ToolbarToggle isActive={textStyle.italic} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('italic')} icon="italic" tooltipLabel="Italic" />
              <ToolbarToggle isActive={textStyle.underline} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('underline')} icon="underline" tooltipLabel="Underline" />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <ToolbarToggle isActive={false} icon="listUl" tooltipLabel="Bulleted list" />
              <ToolbarToggle isActive={false} icon="listOl" tooltipLabel="Numbered list" />
              <ToolbarToggle isActive={false} icon="listCheck" tooltipLabel="Checklist" />
            </ToolbarGroup>
          </Toolbar>
        )
      )}
    />
  );
};
