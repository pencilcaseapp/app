import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentGroupEmpty } from './document-group-empty';

describe('DocumentGroupEmpty', () => {
  test('renders the message', () => {
    render(<DocumentGroupEmpty>No deleted documents</DocumentGroupEmpty>);

    expect(screen.getByText('No deleted documents')).toBeInTheDocument();
  });

  test('renders no icon when omitted', () => {
    const { container } = render(
      <DocumentGroupEmpty>No deleted documents</DocumentGroupEmpty>,
    );

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('renders the icon when provided', () => {
    const { container } = render(
      <DocumentGroupEmpty icon="trash">
        No deleted documents
      </DocumentGroupEmpty>,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders the actionArea when provided', () => {
    render(
      <DocumentGroupEmpty
        actionArea={<button data-testid="action-area">Create Doc</button>}
      >
        Nothing here yet
      </DocumentGroupEmpty>,
    );

    expect(screen.getByTestId('action-area')).toBeInTheDocument();
  });

  test('should match snapshot', () => {
    const { container } = render(
      <DocumentGroupEmpty icon="trash">
        No deleted documents
      </DocumentGroupEmpty>,
    );

    expect(container).toMatchSnapshot();
  });
});
