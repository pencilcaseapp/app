import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $addUpdateTag, $createParagraphNode, $getSelection, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND, mergeRegister, SELECTION_CHANGE_COMMAND, SKIP_SELECTION_FOCUS_TAG } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { useCallback, useEffect, useRef, useState } from 'react';
import { $getFormatBlock } from '../utils/node';
import { Button, Topbar, Toolbar, ToolbarGroup, ToolbarToggle, ToolbarSeparator } from '~/ui';
import type { EditorFormatBlock } from '../editor.types';
import { useMedia, useWindowScroll } from 'react-use';
import { useVirtualKeyboard } from '~/hooks/use-virtual-keyboard';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';

export const EditorPluginToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [formatBlock, setFormatBlock] = useState<EditorFormatBlock>('p');
  const [textStyle, setTextStyle] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const isWide = useMedia('(min-width: 1024px)');
  const { y: windowY } = useWindowScroll();
  const isScrolling = windowY > 65;
  const topbarRef = useRef<HTMLElement>(null);
  const [isVirtualKeyboardOpen] = useVirtualKeyboard();

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    setTextStyle({
      bold: selection.hasFormat('bold'),
      italic: selection.hasFormat('italic'),
      underline: selection.hasFormat('underline'),
    });

    setFormatBlock($getFormatBlock(selection));
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
    );
  }, [editor, $updateToolbar]);

  const toggleTextStyle = useCallback((style: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, style);
  }, [editor]);

  const toggleHeadline = useCallback((block: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      const formatBlock = $getFormatBlock(selection);
      if (formatBlock === block) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
      else {
        $setBlocksType(selection, () => $createHeadingNode(block));
      }
    });
  }, [editor]);

  const toggleList = useCallback((block: 'bullet' | 'number' | 'check') => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);

      const formatBlock = $getFormatBlock(selection);
      if (formatBlock === block) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
      else if (block === 'bullet') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      }
      else if (block === 'number') {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      }
      else if (block === 'check') {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      }
    });
  }, [editor]);

  const handleEditorFocus = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Topbar
      ref={topbarRef}
      hasBorder={isVirtualKeyboardOpen}
      left={!isVirtualKeyboardOpen ? <Button colorLight="secondary" icon="sidebar" iconTitle="sidebar" /> : <Button colorLight="secondary" icon="close" className="text-pca-grey-400!" iconTitle="close" />}
      right={!isVirtualKeyboardOpen && (<Button icon="share" colorLight="upgrade">Share</Button>)}
      center={(
        (isWide || isVirtualKeyboardOpen) && (
          <Toolbar isScrolling={isScrolling}>
            <ToolbarGroup>
              <ToolbarToggle isActive={formatBlock === 'h1'} onMouseDown={handleEditorFocus} onClick={() => toggleHeadline('h1')} icon="h1" tooltipLabel="Heading 1" />
              <ToolbarToggle isActive={formatBlock === 'h2'} onMouseDown={handleEditorFocus} onClick={() => toggleHeadline('h2')} icon="h2" tooltipLabel="Heading 2" />
              <ToolbarToggle isActive={formatBlock === 'h3'} onMouseDown={handleEditorFocus} onClick={() => toggleHeadline('h3')} icon="h3" tooltipLabel="Heading 3" />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <ToolbarToggle isActive={textStyle.bold} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('bold')} icon="bold" tooltipLabel="Bold" />
              <ToolbarToggle isActive={textStyle.italic} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('italic')} icon="italic" tooltipLabel="Italic" />
              <ToolbarToggle isActive={textStyle.underline} onMouseDown={handleEditorFocus} onClick={() => toggleTextStyle('underline')} icon="underline" tooltipLabel="Underline" />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <ToolbarToggle isActive={formatBlock === 'bullet'} onMouseDown={handleEditorFocus} onClick={() => toggleList('bullet')} icon="listUl" tooltipLabel="Bulleted list" />
              <ToolbarToggle isActive={formatBlock === 'number'} onMouseDown={handleEditorFocus} onClick={() => toggleList('number')} icon="listOl" tooltipLabel="Numbered list" />
              <ToolbarToggle isActive={formatBlock === 'check'} onMouseDown={handleEditorFocus} onClick={() => toggleList('check')} icon="listCheck" tooltipLabel="Checklist" />
            </ToolbarGroup>
          </Toolbar>
        )
      )}
    />
  );
};
