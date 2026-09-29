import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { createEditor } from 'lexical';
import { ImageNode } from './image-node';
import { ImageView } from './image-view';

const src = '/doc/a1e0b1c3-0000-4000-8000-000000000000/assets/'
  + 'b3f1c2d4-0000-4000-8000-000000000000';

function importImage(json: Record<string, unknown>) {
  const editor = createEditor({ nodes: [ImageNode] });
  let exported: unknown;

  editor.update(() => {
    exported = ImageNode.importJSON(json).exportJSON();
  }, { discrete: true });

  return exported;
}

function renderView(viewSrc: string) {
  return render(
    <LexicalComposer
      initialConfig={{ namespace: 'test', onError: console.error }}
    >
      <ImageView nodeKey="1" src={viewSrc} width={800} height={600} />
    </LexicalComposer>,
  );
}

describe('ImageNode', () => {
  test('round trips through JSON', () => {
    expect(importImage({ src, width: 800, height: 600 })).toMatchObject({
      type: 'image',
      src,
      width: 800,
      height: 600,
    });
  });

  test('makes do with a malformed payload', () => {
    expect(importImage({ src: 42, width: 'wide', height: -3 }))
      .toMatchObject({ src: '', width: 1, height: 1 });
  });
});

describe('ImageView', () => {
  test('shows one of our assets', () => {
    renderView(src);

    expect(screen.getByRole('presentation')).toHaveAttribute('src', src);
  });

  test('never loads an image from anywhere else', () => {
    const { container } = renderView('https://tracker.example/pixel.png');

    expect(container.querySelector('img')).toBeNull();
  });
});
