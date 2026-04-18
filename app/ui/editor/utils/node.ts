import { $findMatchingParent, $isRootOrShadowRoot, type LexicalNode, type RangeSelection } from 'lexical';
import type { EditorFormatBlock } from '../editor.types';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isListNode, ListNode } from '@lexical/list';
import { $getNearestNodeOfType } from '@lexical/utils';

export function $findTopLevelElement(node: LexicalNode) {
  let topLevelElement
    = node.getKey() === 'root'
      ? node
      : $findMatchingParent(node, (e) => {
          const parent = e.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        });

  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }

  return topLevelElement;
}

export function $getFormatBlock(selection: RangeSelection): EditorFormatBlock {
  const anchorNode = selection.anchor.getNode();
  const element = $findTopLevelElement(anchorNode);
  const isHeading = $isHeadingNode(element);
  const isList = $isListNode(element);

  if (isHeading && element.getTag() === 'h1') {
    return 'h1';
  }

  if (isHeading && element.getTag() === 'h2') {
    return 'h2';
  }

  if (isHeading && element.getTag() === 'h3') {
    return 'h3';
  }

  if (isList) {
    const parentList = $getNearestNodeOfType<ListNode>(
      anchorNode,
      ListNode,
    );

    return parentList
      ? parentList.getListType()
      : element.getListType();
  }

  return 'p';
}
