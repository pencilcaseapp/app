import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '../badge/badge';
import { PlanSummary } from './plan-summary';

describe('PlanSummary', () => {
  it('renders the plan with its price', () => {
    const { container } = render(
      <PlanSummary
        product="Pencil Case"
        plan="Pro"
        price="25 €"
        period="renews yearly"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
    expect(screen.getByText('Pencil Case')).toBeInTheDocument();
    expect(screen.getByText('25 €')).toBeInTheDocument();
    expect(screen.getByText('/ renews yearly')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the badge and the detail line', () => {
    const { container } = render(
      <PlanSummary
        product="Pencil Case"
        plan="Pro"
        price="25 €"
        period="renews yearly"
        badge={<Badge variant="success">Active</Badge>}
        detail="Renews at: 06.07.2026"
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Renews at: 06.07.2026')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('leaves the price line out without a price', () => {
    render(<PlanSummary product="Pencil Case" plan="Pro" />);

    expect(screen.queryByText(/renews/)).not.toBeInTheDocument();
  });
});
