import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its content', () => {
    const { getByText } = render(<Badge>Status Badge</Badge>);

    expect(getByText('Status Badge')).toBeInTheDocument();
  });

  const variants = [
    { variant: 'info', bg: 'bg-pca-blue-300' },
    { variant: 'success', bg: 'bg-pca-green-300' },
    { variant: 'warning', bg: 'bg-pca-orange-300' },
    { variant: 'danger', bg: 'bg-pca-red-300' },
  ] as const;

  it.each(variants)('variant $variant — applies the correct background class', ({ variant, bg }) => {
    const { container } = render(<Badge variant={variant}>Title</Badge>);

    expect(container.firstChild).toHaveClass(bg);
  });

  it.each(variants)('variant $variant — matches snapshot', ({ variant }) => {
    const { container } = render(<Badge variant={variant}>Title</Badge>);

    expect(container).toMatchSnapshot();
  });
});
