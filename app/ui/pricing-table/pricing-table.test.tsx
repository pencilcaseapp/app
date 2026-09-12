import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PricingTable } from './pricing-table';

const props = {
  plan: 'pencil case pro',
  amount: '25 €',
  period: '/ year',
  features: ['Unlimited docs', 'Hosted in the EU'],
};

describe('PricingTable', () => {
  it('renders plan, price, features and slots', () => {
    const { container } = render(
      <PricingTable
        {...props}
        actionArea={<button>Upgrade to Pro</button>}
        finePrint="Secure checkout by Creem."
      />,
    );

    expect(screen.getByText('pencil case pro')).toBeInTheDocument();
    expect(screen.getByText('25 €')).toBeInTheDocument();
    expect(screen.getByText('Unlimited docs')).toBeInTheDocument();
    expect(screen.getByText('Hosted in the EU')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upgrade to Pro' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Secure checkout by Creem.'),
    ).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders on a white background', () => {
    const { container } = render(
      <PricingTable {...props} background="white" />,
    );

    expect(container.firstChild).toHaveClass('bg-pca-white');
    expect(container.firstChild).not.toHaveClass('bg-pca-yellow-500');
    expect(container).toMatchSnapshot();
  });

  it('renders missing features with the danger X', () => {
    const { container } = render(
      <PricingTable
        {...props}
        background="white"
        missingFeatures={['Access control for collaboration']}
      />,
    );

    const missing = screen
      .getByText('Access control for collaboration')
      .closest('li');
    const included = screen.getByText('Hosted in the EU').closest('li');

    expect(missing?.querySelector('.text-pca-red-500')).toBeInTheDocument();
    expect(
      included?.querySelector('.text-pca-red-500'),
    ).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders without action area and fine print', () => {
    render(<PricingTable {...props} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Secure checkout by Creem.'),
    ).not.toBeInTheDocument();
  });
});
