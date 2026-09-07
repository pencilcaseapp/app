import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanMatrix } from './plan-matrix';

const props = {
  caption: 'What the free and the pro plan include',
  plans: [{ name: 'Free' }, { name: 'Pro', emphasis: true }],
  rows: [
    { label: 'Docs', cells: ['3', 'Unlimited'] },
    { label: 'Access control', cells: [false, true] },
    { label: 'Hosted in the EU', cells: [true, true] },
  ],
};

describe('PlanMatrix', () => {
  it('renders a row per feature with a cell per plan', () => {
    const { container } = render(<PlanMatrix {...props} />);

    expect(screen.getByRole('table', {
      name: 'What the free and the pro plan include',
    })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Pro' }))
      .toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Docs' }))
      .toBeInTheDocument();
    expect(screen.getByText('Unlimited')).toBeInTheDocument();
    expect(screen.getAllByTitle('Included')).toHaveLength(3);
    expect(screen.getAllByTitle('Not included')).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });
});
