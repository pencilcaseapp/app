import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DangerZone } from './danger-zone';

describe('DangerZone', () => {
  it('renders a region named by its title', () => {
    const { container } = render(
      <DangerZone
        title="Danger zone"
        description="Delete your account."
        actionArea={<button type="button">Delete account</button>}
      />,
    );

    expect(screen.getByRole('region', { name: 'Danger zone' }))
      .toHaveTextContent('Delete your account.');
    expect(container).toMatchSnapshot();
  });
});
