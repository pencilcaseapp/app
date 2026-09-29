import { describe, expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createImageNode } from '~/ui/editor/nodes/image-node';
import { EDITOR_NODES } from '~/ui/editor/editor-nodes';
import { createHeadlessEditorState } from '~/utils/headless';
import {
  PREVIEW_EAGER_IMAGES,
  renderDocumentPreview,
} from './document-preview';

const src = '/doc/a1e0b1c3-0000-4000-8000-000000000000/assets/'
  + 'b3f1c2d4-0000-4000-8000-000000000000';

describe('renderDocumentPreview', () => {
  test('draws the content the way the editor does', () => {
    const content = createHeadlessEditorState(() => {
      const root = $getRoot();
      root.clear();
      root.append(
        $createHeadingNode('h1').append($createTextNode('Hello')),
        $createParagraphNode().append(
          $createTextNode('bold').toggleFormat('bold'),
        ),
        $createListNode('check').append(
          $createListItemNode(true).append($createTextNode('done')),
        ),
      );
    }, EDITOR_NODES);

    expect(renderDocumentPreview(content)).toMatchSnapshot();
  });

  test('draws an image of ours', () => {
    const content = createHeadlessEditorState(() => {
      $getRoot().append($createImageNode({ src, width: 800, height: 600 }));
    }, EDITOR_NODES);

    const html = renderDocumentPreview(content);

    expect(html).toContain(`<img src="${src}" width="800" height="600"`);
  });

  test('hands an image\'s source over and keeps the original', () => {
    const content = createHeadlessEditorState(() => {
      $getRoot().append($createImageNode({ src, width: 800, height: 600 }));
    }, EDITOR_NODES);

    const html = renderDocumentPreview(content, () => 'https://cdn.example/a');

    expect(html).toContain('<img src="https://cdn.example/a"');
    expect(html).toContain(`data-src="${src}"`);
  });

  test('only loads the images at the top before the page lays out', () => {
    const content = createHeadlessEditorState(() => {
      $getRoot().append(...Array.from(
        { length: PREVIEW_EAGER_IMAGES + 1 },
        () => $createImageNode({ src, width: 800, height: 600 }),
      ));
    }, EDITOR_NODES);

    const html = renderDocumentPreview(content);

    expect(html.match(/loading="eager"/g)).toHaveLength(PREVIEW_EAGER_IMAGES);
    expect(html.match(/loading="lazy"/g)).toHaveLength(1);
  });

  test('leaves an image from elsewhere out', () => {
    const content = createHeadlessEditorState(() => {
      $getRoot().append($createImageNode({
        src: 'https://example.com/tracker.png',
        width: 800,
        height: 600,
      }));
    }, EDITOR_NODES);

    expect(renderDocumentPreview(content)).not.toContain('example.com');
  });
});
