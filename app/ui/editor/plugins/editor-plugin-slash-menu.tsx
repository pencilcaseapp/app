import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalTypeaheadMenuPlugin } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import type {
  MenuRenderFn,
  TriggerFn,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { MenuOption } from '@lexical/react/LexicalMenuOption';
import { $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import {
  $getSelection,
  $isRangeSelection,
  type LexicalCommand,
  type LexicalEditor,
  type TextNode,
} from 'lexical';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'motion/react';
import classNames from 'classnames';
import { Icon } from '~/ui/icon/icon';
import type { IconName } from '~/ui/icon/icons';
import { Typography } from '~/ui/typography/typography';
import { Separator } from '~/ui/separator/separator';
import {
  menuItemClasses,
  menuShellClasses,
  menuSurfaceClasses,
} from '~/ui/menu-surface/menu-surface';

type SlashMenuGroup = 'heading' | 'list';

type SlashMenuBlock = {
  key: string;
  label: string;
  icon: IconName;
  group: SlashMenuGroup;
  keywords: string[];
  /** Runs inside the editor update that removes the typed query. */
  $insert: (editor: LexicalEditor) => void;
};

const $insertHeading = (tag: 'h1' | 'h2' | 'h3') => () => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return;
  }

  $setBlocksType(selection, () => $createHeadingNode(tag));
};

const $insertList
  = (command: LexicalCommand<void>) => (editor: LexicalEditor) => {
    editor.dispatchCommand(command, undefined);
  };

const BLOCKS: SlashMenuBlock[] = [
  {
    key: 'h1',
    label: 'Heading 1',
    icon: 'h1',
    group: 'heading',
    keywords: ['heading', 'title', 'h1'],
    $insert: $insertHeading('h1'),
  },
  {
    key: 'h2',
    label: 'Heading 2',
    icon: 'h2',
    group: 'heading',
    keywords: ['heading', 'subtitle', 'h2'],
    $insert: $insertHeading('h2'),
  },
  {
    key: 'h3',
    label: 'Heading 3',
    icon: 'h3',
    group: 'heading',
    keywords: ['heading', 'subtitle', 'h3'],
    $insert: $insertHeading('h3'),
  },
  {
    key: 'number',
    label: 'Numbered list',
    icon: 'listOl',
    group: 'list',
    keywords: ['numbered', 'ordered', 'list'],
    $insert: $insertList(INSERT_ORDERED_LIST_COMMAND),
  },
  {
    key: 'bullet',
    label: 'Bulleted list',
    icon: 'listUl',
    group: 'list',
    keywords: ['bulleted', 'unordered', 'list'],
    $insert: $insertList(INSERT_UNORDERED_LIST_COMMAND),
  },
  {
    key: 'check',
    label: 'Checklist',
    icon: 'listCheck',
    group: 'list',
    keywords: ['checklist', 'todo', 'task', 'list'],
    $insert: $insertList(INSERT_CHECK_LIST_COMMAND),
  },
];

class SlashMenuOption extends MenuOption {
  constructor(readonly block: SlashMenuBlock) {
    super(block.key);
  }
}

const OPTIONS = BLOCKS.map(block => new SlashMenuOption(block));

function matchOptions(query: string | null) {
  if (!query) {
    return OPTIONS;
  }

  const needle = query.toLowerCase();

  return OPTIONS.filter(({ block }) =>
    block.label.toLowerCase().startsWith(needle)
    || block.keywords.some(keyword => keyword.startsWith(needle)),
  );
}

const SLASH_QUERY = /^\/(\S*)$/;

/**
 * The `scaleIn` of the other menus, run from JS.
 *
 * The typeahead plugin positions the menu from an element it takes out of the
 * page and puts back on every keystroke. That cancels and restarts a CSS
 * animation, so `animate-scale-in` played again on every character of the
 * query and the menu read as closing and reopening. An animation started once,
 * when the menu mounts, survives the same treatment.
 */
const SCALE_IN_KEYFRAMES = [
  { opacity: 0.8, transform: 'scale(0.9)' },
  { opacity: 1, transform: 'scale(1)' },
];

const SCALE_IN_OPTIONS = {
  duration: 250,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

/**
 * Whether the text up to the caret is the whole row. The trigger only looks at
 * the text node the caret sits in, so this is what keeps the menu to a row the
 * slash starts: nothing before it, nothing after the caret.
 */
function $isWholeRow(text: string) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }

  const row = selection.anchor.getNode().getParent();

  return row !== null && row.getTextContent() === text;
}

type SlashMenuProps = {
  options: SlashMenuOption[];
  selectedIndex: number | null;
  onHighlight: (index: number) => void;
  onSelect: (option: SlashMenuOption) => void;
};

const SlashMenu: React.FC<SlashMenuProps> = ({
  options,
  selectedIndex,
  onHighlight,
  onSelect,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    menuRef.current?.animate(SCALE_IN_KEYFRAMES, SCALE_IN_OPTIONS);
  }, [shouldReduceMotion]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Block types"
      className={classNames(
        menuShellClasses,
        menuSurfaceClasses.glass,
        'z-50 origin-top-left',
      )}
    >
      {options.map((option, index) => (
        <Fragment key={option.key}>
          {index > 0
            && options[index - 1].block.group !== option.block.group
            && <Separator className="my-1" />}
          <button
            type="button"
            role="menuitem"
            id={`typeahead-item-${index}`}
            ref={option.setRefElement}
            aria-selected={index === selectedIndex}
            className={classNames(
              menuItemClasses,
              'cursor-pointer text-pca-grey-900 dark:text-pca-white',
              index === selectedIndex
              && 'bg-pca-grey-200/40 dark:bg-pca-white/10',
            )}
            // The caret stays where it is: the menu is picked from, not
            // focused, and a blur would close it before the click lands.
            onMouseDown={event => event.preventDefault()}
            onMouseEnter={() => onHighlight(index)}
            onClick={() => onSelect(option)}
          >
            <Icon
              icon={option.block.icon}
              className="mr-2 shrink-0 w-5 h-5"
            />
            <Typography
              as="span"
              variant="bodySmall"
              className="grow text-inherit!"
              textAlign="left"
            >
              {option.block.label}
            </Typography>
          </button>
        </Fragment>
      ))}
    </div>
  );
};

/**
 * The block menu the editor opens on a slash: typing `/` on an empty row
 * offers the heading and list blocks, and picking one turns the row into that
 * block and takes the query back out.
 *
 * Only on an empty row, because a slash in the middle of a sentence is a
 * slash — the menu is for the row somebody is about to write, which is also
 * what makes replacing the row's block the right thing to do.
 *
 * The keyboard belongs to the typeahead plugin: it moves the highlight, picks
 * with Enter or Tab and closes on Escape from commands registered on the
 * editor, so the caret never leaves the document and the menu is drawn, not
 * focused. That is why this is not the dropdown component — it shares the
 * surface and the item box with it, not the Radix focus handling.
 */
export const EditorPluginSlashMenu: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);

  const options = useMemo(() => matchOptions(query), [query]);

  const triggerFn = useCallback<TriggerFn>((text) => {
    const match = SLASH_QUERY.exec(text);
    if (match === null || !$isWholeRow(text)) {
      return null;
    }

    const [replaceableString, matchingString] = match;
    if (matchOptions(matchingString).length === 0) {
      return null;
    }

    return { leadOffset: 0, matchingString, replaceableString };
  }, []);

  const onSelectOption = useCallback((
    option: SlashMenuOption,
    nodeContainingQuery: TextNode | null,
    closeMenu: () => void,
  ) => {
    editor.update(() => {
      nodeContainingQuery?.remove();
      option.block.$insert(editor);
      closeMenu();
    });
  }, [editor]);

  const renderMenu = useCallback<MenuRenderFn<SlashMenuOption>>((
    anchorElementRef,
    {
      selectedIndex,
      selectOptionAndCleanUp,
      setHighlightedIndex,
      options: menuOptions,
    },
  ) => {
    if (anchorElementRef.current === null || menuOptions.length === 0) {
      return null;
    }

    return createPortal(
      <SlashMenu
        options={menuOptions}
        selectedIndex={selectedIndex}
        onHighlight={setHighlightedIndex}
        onSelect={selectOptionAndCleanUp}
      />,
      anchorElementRef.current,
    );
  }, []);

  return (
    <LexicalTypeaheadMenuPlugin<SlashMenuOption>
      options={options}
      triggerFn={triggerFn}
      onQueryChange={setQuery}
      onSelectOption={onSelectOption}
      menuRenderFn={renderMenu}
    />
  );
};
