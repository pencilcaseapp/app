import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Notification } from './notification';

describe('Notification', () => {
  describe('rendering', () => {
    it('renders the title', () => {
      const { getByText } = render(<Notification title="Something went wrong" />);

      expect(getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders the description when provided', () => {
      const { getByText } = render(
        <Notification title="Heads up" description="More details here" />,
      );

      expect(getByText('More details here')).toBeInTheDocument();
    });

    it('does not render a description when omitted', () => {
      const { queryByText } = render(<Notification title="Heads up" />);

      expect(queryByText('More details here')).not.toBeInTheDocument();
    });
  });

  const variants = [
    { variant: 'info', bg: 'bg-pca-blue-300', border: 'border-pca-blue-900' },
    { variant: 'success', bg: 'bg-pca-green-300', border: 'border-pca-green-900' },
    { variant: 'warning', bg: 'bg-pca-orange-300', border: 'border-pca-orange-900' },
    { variant: 'danger', bg: 'bg-pca-red-300', border: 'border-pca-red-900' },
  ] as const;

  it.each(variants)('variant $variant — applies correct background and border classes', ({ variant, bg, border }) => {
    const { getByRole } = render(<Notification variant={variant} title="Title" />);

    expect(getByRole('status')).toHaveClass(bg, border);
  });

  it.each(variants)('variant $variant — matches snapshot', ({ variant }) => {
    const { container } = render(
      <Notification variant={variant} title="Title" description="Description" />,
    );

    expect(container).toMatchSnapshot();
  });
});
