import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code-core';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/extension';
import { ImageNode } from './nodes/image-node';

/** Every node a document can hold, in the editor and on the server. */
export const EDITOR_NODES = [
  AutoLinkNode,
  LinkNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  HeadingNode,
  QuoteNode,
  HorizontalRuleNode,
  ImageNode,
];
