import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '../badge/badge';
import { PlanCard } from './plan-card';

const props = { plan: 'Pencil Case Pro', amount: '25 €', period: '/ year' };

describe('PlanCard', () => {
  it('renders the plan and its price on the yellow card', () => {
    const { container } = render(<PlanCard {...props} />);

    expect(screen.getByText('Pencil Case Pro')).toBeInTheDocument();
    expect(screen.getByText('25 €')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-pca-yellow-500');
    expect(container).toMatchSnapshot();
  });

  it('renders the badge on the white card', () => {
    const { container } = render(
      <PlanCard
        {...props}
        plan="Pencil Case Free"
        amount="0 €"
        background="white"
        badge={<Badge>Current</Badge>}
      />,
    );

    expect(container.firstChild).toHaveClass('bg-pca-white');
    expect(screen.getAllByText('Current')).toHaveLength(2);
    expect(container).toMatchSnapshot();
  });
});
