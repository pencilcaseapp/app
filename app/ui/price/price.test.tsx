import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Price } from './price';

describe('Price', () => {
  it('renders on the yellow card by default', () => {
    const { container } = render(<Price amount="25 €" period="/ year" />);

    expect(screen.getByText('25 €')).toBeInTheDocument();
    expect(screen.getByText('/ year')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders on a white background', () => {
    const { container } = render(
      <Price amount="25 €" period="/ year" background="white" />,
    );

    expect(container).toMatchSnapshot();
  });
});
