import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { EditorPreviewContent } from './editor-preview';

const html = '<p>Hello</p><img src="/a.webp" alt="">';

describe('EditorPreviewContent', () => {
  test('draws the content', () => {
    const { container } = render(
      <EditorPreviewContent html={html} hasTopArea={false} />,
    );

    expect(container.querySelector('p')).toHaveTextContent('Hello');
  });

  test('takes over the elements of the server\'s preview', () => {
    const server = render(
      <EditorPreviewContent html={html} hasTopArea={false} />,
    );
    const image = server.container.querySelector('img');

    const { container } = render(
      <EditorPreviewContent
        html={html}
        hasTopArea={false}
        adoptServerPreview
      />,
    );

    expect(container.querySelector('img')).toBe(image);
  });

  test('draws the content itself without a server\'s preview', () => {
    const { container } = render(
      <EditorPreviewContent
        html={html}
        hasTopArea={false}
        adoptServerPreview
      />,
    );

    expect(container.querySelector('p')).toHaveTextContent('Hello');
  });
});
