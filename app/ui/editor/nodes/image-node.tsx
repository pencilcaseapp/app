import type {
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  LexicalParseJSON,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { DecoratorNode } from 'lexical';
import type { JSX } from 'react';
import { ImageView } from './image-view';

export interface ImagePayload {
  src: string;
  /** The stored image's own size, which reserves its box before it loads. */
  width: number;
  height: number;
  /**
   * The width it is shown at, as a share of the column, so it keeps its
   * proportion on every screen. `null` shows it at its own width.
   */
  displayWidth?: number | null;
}

export type SerializedImageNode = Spread<
  ImagePayload,
  SerializedLexicalNode
>;

/**
 * An image as a block of its own between the other blocks, never inline.
 * Its properties sync through Yjs like any other node's.
 */
export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __width: number;
  __height: number;
  __displayWidth: number | null;

  static getType() {
    return 'image';
  }

  static clone(node: ImageNode) {
    return new ImageNode(
      {
        src: node.__src,
        width: node.__width,
        height: node.__height,
        displayWidth: node.__displayWidth,
      },
      node.__key,
    );
  }

  static importJSON(serializedNode: LexicalParseJSON<SerializedImageNode>) {
    const { src, width, height, displayWidth } = serializedNode;

    return $createImageNode({
      src: typeof src === 'string' ? src : '',
      width: toDimension(width),
      height: toDimension(height),
      displayWidth: toDisplayWidth(displayWidth),
    });
  }

  // Lexical's Yjs binding constructs every node type without arguments to
  // learn its properties, so the payload needs a default.
  constructor(
    payload: ImagePayload = { src: '', width: 1, height: 1 },
    key?: NodeKey,
  ) {
    super(key);
    this.__src = payload.src;
    this.__width = payload.width;
    this.__height = payload.height;
    this.__displayWidth = payload.displayWidth ?? null;
  }

  setDisplayWidth(displayWidth: number | null) {
    const writable = this.getWritable();
    writable.__displayWidth = toDisplayWidth(displayWidth);

    return writable;
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      width: this.__width,
      height: this.__height,
      displayWidth: this.__displayWidth,
    };
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img');
    img.src = this.__src;
    img.width = this.__width;
    img.height = this.__height;
    img.alt = '';

    return { element: img };
  }

  createDOM(config: EditorConfig) {
    const div = document.createElement('div');
    div.className = config.theme.image ?? '';

    return div;
  }

  updateDOM() {
    return false;
  }

  isInline() {
    return false;
  }

  decorate() {
    return (
      <ImageView
        nodeKey={this.getKey()}
        src={this.__src}
        width={this.__width}
        height={this.__height}
        displayWidth={this.__displayWidth}
      />
    );
  }
}

export function $createImageNode(payload: ImagePayload) {
  return new ImageNode(payload);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}

function toDimension(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? Math.round(number) : 1;
}

export function toDisplayWidth(value: unknown) {
  const number = Number(value);

  if (value === null || !Number.isFinite(number) || number <= 0) {
    return null;
  }

  return Math.min(Math.round(number * 1000) / 1000, 1);
}
