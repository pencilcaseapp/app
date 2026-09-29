import { describe, expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { createEditor } from 'lexical';
import { ImageNode } from './image-node';
import { AssetUrlsContext } from '~/contexts/asset-urls';
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

function exportImage(imageSrc: string) {
  const editor = createEditor({ nodes: [ImageNode] });
  let element: unknown;

  editor.update(() => {
    element = new ImageNode({ src: imageSrc, width: 800, height: 600 })
      .exportDOM().element;
  }, { discrete: true });

  return element as HTMLElement;
}

function renderView(viewSrc: string, assetUrls: Record<string, string> = {}) {
  return render(
    <AssetUrlsContext value={assetUrls}>
      <LexicalComposer
        initialConfig={{ namespace: 'test', onError: console.error }}
      >
        <ImageView nodeKey="1" src={viewSrc} width={800} height={600} />
      </LexicalComposer>
    </AssetUrlsContext>,
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

  test('exports one of our assets as HTML, decoded before it is shown', () => {
    const image = exportImage(src).querySelector('img');

    expect(image).toHaveAttribute('src', src);
    expect(image).toHaveAttribute('width', '800');
    expect(image).not.toHaveAttribute('decoding');
  });

  test('never exports an image from anywhere else', () => {
    const element = exportImage('https://example.com/tracker.png');

    expect(element.querySelector('img')).toBeNull();
    expect(element).toHaveClass('bg-pca-grey-100');
  });
});

describe('ImageView', () => {
  test('shows one of our assets', () => {
    renderView(src);

    expect(screen.getByRole('presentation')).toHaveAttribute('src', src);
  });

  test('loads the signed URL the page came with', () => {
    renderView(src, { [src]: 'https://cdn.example/a' });

    const image = screen.getByRole('presentation');
    expect(image).toHaveAttribute('src', 'https://cdn.example/a');
    expect(image).toHaveAttribute('data-src', src);
  });

  test('falls back to its own source once the signed URL fails', () => {
    renderView(src, { [src]: 'https://cdn.example/a' });

    fireEvent.error(screen.getByRole('presentation'));

    expect(screen.getByRole('presentation')).toHaveAttribute('src', src);
  });

  test('never loads an image from anywhere else', () => {
    const { container } = renderView('https://tracker.example/pixel.png');

    expect(container.querySelector('img')).toBeNull();
  });
});
