import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingIndicator } from './loading-indicator';

describe('LoadingIndicator', () => {
  test('renders with status role and accessible label', () => {
    render(<LoadingIndicator />);
    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders three dots', () => {
    const { container } = render(<LoadingIndicator />);
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots).toHaveLength(3);
  });

  test('appends custom className to the outer wrapper', () => {
    const { container } = render(<LoadingIndicator className="my-class" />);
    expect(container.firstElementChild).toHaveClass('my-class');
  });

  test('renders loading indicator', () => {
    const { container } = render(<LoadingIndicator />);
    expect(container).toMatchSnapshot();
  });

  test('applies staggered animation delays to dots', () => {
    const { container } = render(<LoadingIndicator />);
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots[0]).toHaveStyle({ animationDelay: '0s' });
    expect(dots[1]).toHaveStyle({ animationDelay: '0.16s' });
    expect(dots[2]).toHaveStyle({ animationDelay: '0.32s' });
  });
});
