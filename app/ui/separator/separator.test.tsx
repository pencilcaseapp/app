import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from './separator';

describe('horizontal', () => {
  test('matches snapshot', async () => {
    const { container } = render(<Separator />);

    expect(container).toMatchSnapshot();
  });
});

describe('vertical', () => {
  test('matches snapshot', async () => {
    const { container } = render(
      <Separator orientation="vertical" />,
    );

    expect(container).toMatchSnapshot();
  });
});

describe('decorative', () => {
  test('has no separator role when decorative', () => {
    render(<Separator decorative />);

    expect(
      screen.queryByRole('separator'),
    ).not.toBeInTheDocument();
  });

  test('has separator role when not decorative', () => {
    render(<Separator decorative={false} />);

    expect(
      screen.getByRole('separator'),
    ).toBeInTheDocument();
  });
});
