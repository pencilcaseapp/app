import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { PlanOverview } from './plan-overview';

const cardOf = (plan: string) => screen.getByText(plan).closest('.rounded-2xl');

describe('PlanOverview', () => {
  test('opens with the headline over both plans and its children', () => {
    const { container } = render(
      <PlanOverview
        image="flying-docs"
        headline="You’ve used 2 of your 3 free docs."
        subheadline="Unlimited docs, and you decide who gets in."
        currentPlan="free"
      >
        <p>Below the cards</p>
      </PlanOverview>,
    );

    expect(screen.getByRole('heading', {
      name: 'You’ve used 2 of your 3 free docs.',
    })).toBeInTheDocument();
    expect(screen.getByText('Unlimited docs, and you decide who gets in.'))
      .toBeInTheDocument();
    expect(screen.getByText('Pencil Case Free')).toBeInTheDocument();
    expect(screen.getByText('Pencil Case Pro')).toBeInTheDocument();
    expect(screen.getByText('Below the cards')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('marks the free plan as the current one', () => {
    render(
      <PlanOverview image="flying-docs" headline="Free" currentPlan="free" />,
    );

    // The badge renders once per breakpoint slot, both inside the free
    // card: the pro card carries none.
    const badges = screen.getAllByText('Current');
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(badge.closest('.bg-pca-white')).toBeInTheDocument();
    }
    expect(cardOf('Pencil Case Free')).not.toHaveClass('-rotate-1');
    expect(cardOf('Pencil Case Pro')).toHaveClass('-rotate-1');
  });

  test('marks pro as the current plan and retires the free card', () => {
    const { container } = render(
      <PlanOverview image="pencil-and-doc" headline="Pro" currentPlan="pro" />,
    );

    for (const badge of screen.getAllByText('Current')) {
      expect(badge.closest('.bg-pca-yellow-500')).toBeInTheDocument();
    }
    expect(cardOf('Pencil Case Pro')).not.toHaveClass('-rotate-1');
    expect(cardOf('Pencil Case Free')).toHaveClass('-rotate-1', 'opacity-60');
    expect(cardOf('Pencil Case Free'))
      .toHaveAttribute('aria-disabled', 'true');
    expect(container.querySelector('img'))
      .toHaveAttribute('src', '/pencil-and-doc-light.svg');
  });
});
