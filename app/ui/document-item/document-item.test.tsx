import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentItem } from './document-item';

describe('DocumentItem', () => {
  test('matches snapshot', () => {
    const { container } = render(
      <DocumentItem
        href="/documents/1"
        title="My document"
        actionArea={<span data-testid="action-area">…</span>}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('renders the title', () => {
    render(<DocumentItem href="/documents/1" title="My document" />);

    expect(screen.getByText('My document')).toBeInTheDocument();
  });

  test('renders as an anchor by default and forwards rest props', () => {
    const { container } = render(
      <DocumentItem href="/documents/1" title="My document" />,
    );

    const anchor = container.querySelector('a');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('href', '/documents/1');
  });
});
