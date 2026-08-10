import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders empty state', () => {
    const { container } = render(
      <EmptyState
        title="No items"
        description="There are no items to display."
        actionArea={<button>Retry</button>}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
