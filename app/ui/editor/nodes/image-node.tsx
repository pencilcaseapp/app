import classNames from 'classnames';
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
import { parseAssetSrc } from '~/utils/asset-src';
import {
  IMAGE_CLASS_NAME,
  IMAGE_FRAME_CLASS_NAME,
  IMAGE_PLACEHOLDER_CLASS_NAME,
  ImageView,
} from './image-view';

export interface ImagePayload {
  src: string;
  /** The stored image's own size, which reserves its box before it loads. */
  width: number;
  height: number;
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

  static getType() {
    return 'image';
  }

  static clone(node: ImageNode) {
    return new ImageNode(
      { src: node.__src, width: node.__width, height: node.__height },
      node.__key,
    );
  }

  static importJSON(serializedNode: LexicalParseJSON<SerializedImageNode>) {
    const { src, width, height } = serializedNode;

    return $createImageNode({
      src: typeof src === 'string' ? src : '',
      width: toDimension(width),
      height: toDimension(height),
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
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      width: this.__width,
      height: this.__height,
    };
  }

  /**
   * What `ImageView` draws, as plain HTML: the server's preview of the
   * document and the HTML the clipboard carries. Like the view, only our
   * own assets are loaded. Unlike the view, the image decodes before the
   * page paints: in the server's HTML it would otherwise leave a blank box
   * for a frame on every reload.
   */
  exportDOM(): DOMExportOutput {
    const frame = document.createElement('div');
    frame.className = IMAGE_FRAME_CLASS_NAME;
    frame.style.width = `${this.__width}px`;

    if (!parseAssetSrc(this.__src)) {
      frame.className = classNames(
        IMAGE_FRAME_CLASS_NAME,
        IMAGE_PLACEHOLDER_CLASS_NAME,
      );
      frame.style.aspectRatio = `${this.__width} / ${this.__height}`;

      return { element: frame };
    }

    const img = document.createElement('img');
    img.src = this.__src;
    img.width = this.__width;
    img.height = this.__height;
    img.alt = '';
    img.loading = 'lazy';
    img.className = IMAGE_CLASS_NAME;
    frame.append(img);

    return { element: frame };
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
