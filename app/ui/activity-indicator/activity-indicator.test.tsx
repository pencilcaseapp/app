import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityIndicator } from './activity-indicator';

describe('ActivityIndicator', () => {
  test('renders with status role and accessible label', () => {
    render(<ActivityIndicator />);
    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument();
  });

  test('draws as many spokes as the progress reaches', () => {
    const { container } = render(<ActivityIndicator progress={0.5} />);
    expect(container.querySelectorAll('line')).toHaveLength(4);
  });

  test('draws the whole wheel and spins it while spinning', () => {
    const { container } = render(
      <ActivityIndicator progress={0} spinning />,
    );
    expect(container.querySelectorAll('line')).toHaveLength(8);
    expect(container.querySelector('svg'))
      .toHaveClass('animate-activity-spin');
  });

  test('renders activity indicator', () => {
    const { container } = render(<ActivityIndicator spinning />);
    expect(container).toMatchSnapshot();
  });
});
