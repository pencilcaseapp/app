import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { PlanOverview } from './plan-overview';

describe('PlanOverview', () => {
  test('compares the plans under the headline', () => {
    const { container } = render(
      <PlanOverview
        image="flying-docs"
        headline="You’ve used 2 of your 3 free docs."
        subheadline="Unlimited docs, and you decide who gets in."
        currentPlan="free"
      />,
    );

    expect(screen.getByRole('heading', {
      name: 'You’ve used 2 of your 3 free docs.',
    })).toBeInTheDocument();
    expect(screen.getByText('Unlimited docs, and you decide who gets in.'))
      .toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Docs' }))
      .toBeInTheDocument();
    expect(screen.getAllByTitle('Not included')).toHaveLength(2);
    expect(container).toMatchSnapshot();
  });

  test('badges the free plan as the current one', () => {
    render(
      <PlanOverview
        image="flying-docs"
        headline="Free"
        currentPlan="free"
      />,
    );

    // The badge renders once per breakpoint slot, both inside the free
    // card: the pro card carries none.
    const badges = screen.getAllByText('Current');
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(badge.closest('.bg-pca-white')).toBeInTheDocument();
    }
  });

  test('badges the pro plan as the current one', () => {
    render(
      <PlanOverview
        image="welcoming-pencil"
        headline="Pro"
        currentPlan="pro"
      />,
    );

    for (const badge of screen.getAllByText('Current')) {
      expect(badge.closest('.bg-pca-yellow-500')).toBeInTheDocument();
    }
  });
});
