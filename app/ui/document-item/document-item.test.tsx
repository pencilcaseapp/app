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

  test('titles the link so the truncation tooltip survives the overlay', () => {
    const { container } = render(
      <DocumentItem href="/documents/1" title="My document" />,
    );

    expect(container.querySelector('a')).toHaveAttribute(
      'title',
      'My document',
    );
  });

  test('matches snapshot with a share mark', () => {
    const { container } = render(
      <DocumentItem
        href="/documents/1"
        title="My document"
        shareState="link"
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('leaves a private document unmarked', () => {
    const { container } = render(
      <DocumentItem href="/documents/1" title="My document" />,
    );

    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByRole('link')).toHaveAccessibleName('My document');
  });

  test('marks a document shared through the link with a globe', () => {
    const { container } = render(
      <DocumentItem
        href="/documents/1"
        title="My document"
        shareState="link"
      />,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByRole('link'))
      .toHaveAccessibleName('My document , Shared publicly');
  });

  test('marks a document shared by e-mail with the people icon', () => {
    render(
      <DocumentItem
        href="/documents/1"
        title="My document"
        shareState="invite"
      />,
    );

    expect(screen.getByRole('link'))
      .toHaveAccessibleName('My document , Shared with invited people');
  });

  test('renders the actionArea as a sibling of the link', () => {
    render(
      <DocumentItem
        href="/documents/1"
        title="My document"
        actionArea={<button data-testid="action-area">…</button>}
      />,
    );

    expect(screen.getByTestId('action-area').closest('a')).toBeNull();
  });
});
