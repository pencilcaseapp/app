import type { EditorThemeClasses } from 'lexical';

const theme: EditorThemeClasses = {
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
  horizontalRule: 'editor-hr',
};

export default theme;
