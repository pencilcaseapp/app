import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentListEmpty } from './document-list-empty';

describe('DocumentListEmpty', () => {
  test('renders the message', () => {
    render(<DocumentListEmpty>No deleted documents</DocumentListEmpty>);

    expect(screen.getByText('No deleted documents')).toBeInTheDocument();
  });

  test('renders no icon when omitted', () => {
    const { container } = render(
      <DocumentListEmpty>No deleted documents</DocumentListEmpty>,
    );

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('renders the icon when provided', () => {
    const { container } = render(
      <DocumentListEmpty icon="trash">
        No deleted documents
      </DocumentListEmpty>,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders the actionArea when provided', () => {
    render(
      <DocumentListEmpty
        actionArea={<button data-testid="action-area">Create Doc</button>}
      >
        Nothing here yet
      </DocumentListEmpty>,
    );

    expect(screen.getByTestId('action-area')).toBeInTheDocument();
  });

  test('should match snapshot', () => {
    const { container } = render(
      <DocumentListEmpty icon="trash">
        No deleted documents
      </DocumentListEmpty>,
    );

    expect(container).toMatchSnapshot();
  });
});
