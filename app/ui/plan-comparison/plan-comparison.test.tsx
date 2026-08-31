import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanComparison } from './plan-comparison';

const props = {
  currentPlan: {
    plan: 'pencil case free',
    amount: '0 €',
    period: '/ year',
    features: ['3 docs'],
  },
  upgradePlan: {
    plan: 'pencil case pro',
    amount: '25 €',
    period: '/ year',
    features: ['Unlimited docs'],
    actionArea: <button>Upgrade to Pro</button>,
  },
};

describe('PlanComparison', () => {
  it('renders both plans', () => {
    const { container } = render(<PlanComparison {...props} />);

    expect(screen.getByText('pencil case free')).toBeInTheDocument();
    expect(screen.getByText('3 docs')).toBeInTheDocument();
    expect(screen.getByText('pencil case pro')).toBeInTheDocument();
    expect(screen.getByText('Unlimited docs')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upgrade to Pro' }),
    ).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the current plan flat and the upgrade on yellow', () => {
    render(<PlanComparison {...props} />);

    const currentCard = screen.getByText('pencil case free').closest('div');
    const upgradeCard = screen.getByText('pencil case pro').closest('div');

    expect(currentCard).toHaveClass('bg-pca-white');
    expect(upgradeCard).toHaveClass('bg-pca-yellow-500');
  });
});
