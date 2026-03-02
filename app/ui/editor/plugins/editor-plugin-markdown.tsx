import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { CHECK_LIST, TRANSFORMERS, type ElementTransformer } from '@lexical/markdown';
import { $createHorizontalRuleNode, $isHorizontalRuleNode, HorizontalRuleNode } from '@lexical/extension';

export const EditorPluginMarkdown: React.FC = () => {
  return (
    <MarkdownShortcutPlugin
      transformers={[
        ...TRANSFORMERS,
        CHECK_LIST,
        HORIZONTAL_RULE,
      ]}
    />
  );
};

const HORIZONTAL_RULE: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => {
    return $isHorizontalRuleNode(node) ? '---' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _children, _match, isImport) => {
    const line = $createHorizontalRuleNode();
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    }
    else {
      parentNode.insertBefore(line);
    }
    line.selectNext();
  },
  type: 'element',
};
