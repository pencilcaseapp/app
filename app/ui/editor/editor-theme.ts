import type { EditorThemeClasses } from 'lexical';

/**
 * The remote cursor label. Lexical anchors it to the cursor it belongs to, so
 * `useCursorNameBounds` reads it back out of the DOM to keep it on screen.
 */
export const CURSOR_NAME_CLASS = 'editor-collab-cursor-name';

const theme: EditorThemeClasses = {
  collaboration: {
    cursor: 'editor-collab-cursor',
    cursorName: CURSOR_NAME_CLASS,
    selection: 'editor-collab-selection',
    selectionBg: 'editor-collab-selection-bg',
  },
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  paragraph: 'editor-paragraph',
  link: 'editor-link',
  list: {
    checklist: 'editor-checklist',
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
    nested: {
      listitem: 'editor-nested-listitem',
    },
    olDepth: [
      'editor-list-ol-depth-1',
      'editor-list-ol-depth-2',
      'editor-list-ol-depth-3',
    ],
    listitemChecked: 'editor-listitem-checked',
    listitemUnchecked: 'editor-listitem-unchecked',
  },
  quote: 'editor-quote',
  ltr: 'editor-ltr',
  rtl: 'editor-rtl',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underline-strikethrough',
    code: 'editor-text-code',
  },
  hr: 'editor-hr',
  code: 'editor-code',
  codeHighlight: {
    'atrule': 'editor-code-token-attr',
    'attr': 'editor-code-token-attr',
    'boolean': 'editor-code-token-property',
    'builtin': 'editor-code-token-selector',
    'cdata': 'editor-code-token-comment',
    'char': 'editor-code-token-selector',
    'class': 'editor-code-token-function',
    'class-name': 'editor-code-token-function',
    'comment': 'editor-code-token-comment',
    'constant': 'editor-code-token-property',
    'deleted': 'editor-code-token-deleted',
    'doctype': 'editor-code-token-comment',
    'entity': 'editor-code-token-operator',
    'function': 'editor-code-token-function',
    'important': 'editor-code-token-variable',
    'inserted': 'editor-code-token-inserted',
    'keyword': 'editor-code-token-attr',
    'namespace': 'editor-code-token-variable',
    'number': 'editor-code-token-property',
    'operator': 'editor-code-token-operator',
    'prolog': 'editor-code-token-comment',
    'property': 'editor-code-token-property',
    'punctuation': 'editor-code-token-punctuation',
    'regex': 'editor-code-token-variable',
    'selector': 'editor-code-token-selector',
    'string': 'editor-code-token-selector',
    'symbol': 'editor-code-token-property',
    'tag': 'editor-code-token-property',
    'unchanged': 'editor-code-token-unchanged',
    'url': 'editor-code-token-operator',
    'variable': 'editor-code-token-variable',
  },
};

export default theme;
