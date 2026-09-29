import { Toolbar } from '~/ui/toolbar/toolbar';
import { ToolbarButton } from '~/ui/toolbar/toolbar-button';
import { ToolbarGroup } from '~/ui/toolbar/toolbar-group';
import { ToolbarSeparator } from '~/ui/toolbar/toolbar-separator';
import { ToolbarToggle } from '~/ui/toolbar/toolbar-toggle';
import type { EditorFormatBlock } from './editor.types';

export type EditorTextStyle = 'bold' | 'italic' | 'underline';
export type EditorListBlock = 'bullet' | 'number' | 'check';

export interface EditorToolbarProps {
  formatBlock?: EditorFormatBlock;
  textStyle?: Record<EditorTextStyle, boolean>;
  isScrolling?: boolean;
  canInsertImages?: boolean;
  onToggleHeadline?: (block: 'h1' | 'h2' | 'h3') => void;
  onToggleTextStyle?: (style: EditorTextStyle) => void;
  onToggleList?: (block: EditorListBlock) => void;
  onPickImages?: () => void;
}

const NO_TEXT_STYLE = { bold: false, italic: false, underline: false };

// Keeps the editor's selection when a button is pressed.
const keepFocus = (event: React.MouseEvent) => event.preventDefault();

/**
 * The formatting buttons of the topbar. Without handlers it only draws
 * them, which is what the server preview does until the editor is there.
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  formatBlock = 'p',
  textStyle = NO_TEXT_STYLE,
  isScrolling,
  canInsertImages = false,
  onToggleHeadline,
  onToggleTextStyle,
  onToggleList,
  onPickImages,
}) => (
  <Toolbar isScrolling={isScrolling}>
    <ToolbarGroup>
      <ToolbarToggle isActive={formatBlock === 'h1'} onMouseDown={keepFocus} onClick={() => onToggleHeadline?.('h1')} icon="h1" tooltipLabel="Heading 1" />
      <ToolbarToggle isActive={formatBlock === 'h2'} onMouseDown={keepFocus} onClick={() => onToggleHeadline?.('h2')} icon="h2" tooltipLabel="Heading 2" />
      <ToolbarToggle isActive={formatBlock === 'h3'} onMouseDown={keepFocus} onClick={() => onToggleHeadline?.('h3')} icon="h3" tooltipLabel="Heading 3" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <ToolbarToggle isActive={textStyle.bold} onMouseDown={keepFocus} onClick={() => onToggleTextStyle?.('bold')} icon="bold" tooltipLabel="Bold" />
      <ToolbarToggle isActive={textStyle.italic} onMouseDown={keepFocus} onClick={() => onToggleTextStyle?.('italic')} icon="italic" tooltipLabel="Italic" />
      <ToolbarToggle isActive={textStyle.underline} onMouseDown={keepFocus} onClick={() => onToggleTextStyle?.('underline')} icon="underline" tooltipLabel="Underline" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <ToolbarToggle isActive={formatBlock === 'bullet'} onMouseDown={keepFocus} onClick={() => onToggleList?.('bullet')} icon="listUl" tooltipLabel="Bulleted list" />
      <ToolbarToggle isActive={formatBlock === 'number'} onMouseDown={keepFocus} onClick={() => onToggleList?.('number')} icon="listOl" tooltipLabel="Numbered list" />
      <ToolbarToggle isActive={formatBlock === 'check'} onMouseDown={keepFocus} onClick={() => onToggleList?.('check')} icon="listCheck" tooltipLabel="Checklist" />
    </ToolbarGroup>
    {canInsertImages && (
      <>
        <ToolbarSeparator />
        <ToolbarGroup>
          <ToolbarButton onMouseDown={keepFocus} onClick={onPickImages} icon="image" tooltipLabel="Image" />
        </ToolbarGroup>
      </>
    )}
  </Toolbar>
);
