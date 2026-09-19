import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '../badge/badge';
import { PricingCard } from './pricing-card';

const props = {
  plan: 'pencil case pro',
  amount: '25 €',
  period: '/ year',
  features: ['Unlimited docs', 'Hosted in the EU'],
};

describe('PricingCard', () => {
  it('renders plan, price, features and slots', () => {
    const { container } = render(
      <PricingCard
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
      <PricingCard {...props} background="white" />,
    );

    expect(container.firstChild).toHaveClass('bg-pca-white');
    expect(container.firstChild).not.toHaveClass('bg-pca-yellow-500');
    expect(container).toMatchSnapshot();
  });

  it('renders missing features with the muted X', () => {
    const { container } = render(
      <PricingCard
        {...props}
        background="white"
        missingFeatures={['Access control for collaboration']}
      />,
    );

    const missing = screen
      .getByText('Access control for collaboration')
      .closest('li');
    const included = screen.getByText('Hosted in the EU').closest('li');

    expect(missing?.querySelector('.text-pca-grey-400')).toBeInTheDocument();
    expect(
      included?.querySelector('.text-pca-grey-400'),
    ).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders without action area and fine print', () => {
    render(<PricingCard {...props} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Secure checkout by Creem.'),
    ).not.toBeInTheDocument();
  });

  it('renders the badge inline next to the plan name', () => {
    render(
      <PricingCard {...props} badge={<Badge>Current</Badge>} />,
    );

    expect(screen.getAllByText('Current')).toHaveLength(1);
  });

  it('tilts the yellow card unless told otherwise', () => {
    const { container, rerender } = render(<PricingCard {...props} />);
    expect(container.firstChild).toHaveClass('-rotate-1');

    rerender(<PricingCard {...props} tilted={false} />);
    expect(container.firstChild).not.toHaveClass('-rotate-1');

    rerender(<PricingCard {...props} background="white" tilted />);
    expect(container.firstChild).toHaveClass('-rotate-1');
  });

  it('greys out a disabled card', () => {
    const { container } = render(
      <PricingCard {...props} background="white" size="compact" disabled />,
    );

    expect(container.firstChild).toHaveAttribute('aria-disabled', 'true');
    expect(container.firstChild).toHaveClass('opacity-60', 'bg-pca-grey-100');
    expect(container.firstChild).not.toHaveClass('bg-pca-white');
    expect(container).toMatchSnapshot();
  });

  it('renders the compact card without a feature list', () => {
    const { container } = render(
      <PricingCard
        plan="Pencil Case Pro"
        amount="25 €"
        period="/ year"
        size="compact"
      />,
    );

    expect(container.firstChild).toHaveClass('p-3');
    expect(container.querySelector('ul')).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('reserves a badge row in the compact card', () => {
    const { container } = render(
      <PricingCard
        plan="Pencil Case Free"
        amount="0 €"
        period="/ year"
        background="white"
        size="compact"
        badge={<Badge>Current</Badge>}
      />,
    );

    expect(container.firstChild).toHaveClass('bg-pca-white');
    expect(screen.getAllByText('Current')).toHaveLength(2);
    expect(container).toMatchSnapshot();
  });
});
