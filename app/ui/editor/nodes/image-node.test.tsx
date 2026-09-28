import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { createEditor } from 'lexical';
import { ImageNode } from './image-node';
import { ImageView } from './image-view';

const src = '/user-assets/b3f1c2d4-0000-4000-8000-000000000000';

function importImage(json: Record<string, unknown>) {
  const editor = createEditor({ nodes: [ImageNode] });
  let exported: unknown;

  editor.update(() => {
    exported = ImageNode.importJSON(
      json as Parameters<typeof ImageNode.importJSON>[0],
    ).exportJSON();
  }, { discrete: true });

  return exported;
}

function renderView(viewSrc: string, displayWidth: number | null = null) {
  return render(
    <LexicalComposer
      initialConfig={{ namespace: 'test', onError: console.error }}
    >
      <ImageView
        nodeKey="1"
        src={viewSrc}
        width={800}
        height={600}
        displayWidth={displayWidth}
      />
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
      displayWidth: null,
    });
  });

  test('keeps the display width as a share of the column', () => {
    expect(importImage({ src, width: 800, height: 600, displayWidth: 0.5 }))
      .toMatchObject({ displayWidth: 0.5 });
  });

  test('never makes an image wider than the column', () => {
    expect(importImage({ src, width: 800, height: 600, displayWidth: 3 }))
      .toMatchObject({ displayWidth: 1 });
  });

  test('makes do with a malformed payload', () => {
    expect(importImage({
      src: 42,
      width: 'wide',
      height: -3,
      displayWidth: 'half',
    })).toMatchObject({ src: '', width: 1, height: 1, displayWidth: null });
  });
});

describe('ImageView', () => {
  test('shows one of our assets', () => {
    renderView(src);

    expect(screen.getByRole('presentation')).toHaveAttribute('src', src);
  });

  test('shows an image at its own width, capped at the column', () => {
    renderView(src);

    const frame = screen.getByRole('presentation').parentElement!;
    expect(frame.style.width).toBe('800px');
    expect(frame.style.maxWidth).toBe('min(100%, 800px)');
  });

  test('shows a resized image at its share of the column', () => {
    renderView(src, 0.5);

    const frame = screen.getByRole('presentation').parentElement!;
    expect(frame.style.width).toBe('50%');
  });

  test('never loads an image from anywhere else', () => {
    const { container } = renderView('https://tracker.example/pixel.png');

    expect(container.querySelector('img')).toBeNull();
  });
});
