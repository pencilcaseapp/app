import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Meter } from './meter';

test('renders label and track', () => {
  const { container } = render(
    <Meter label="1 free doc(s) left." value={90} />,
  );

  expect(container).toMatchSnapshot();
});

test('exposes the label as the accessible name', () => {
  render(<Meter label="1 free doc(s) left." value={90} />);

  expect(screen.getByRole('meter', { name: '1 free doc(s) left.' }))
    .toBeInTheDocument();
});

test('reflects the value to assistive technology', () => {
  render(<Meter label="2 free doc(s) left." value={1} max={3} />);

  const meter = screen.getByRole('meter');

  expect(meter).toHaveAttribute('aria-valuenow', '1');
  expect(meter).toHaveAttribute('aria-valuemin', '0');
  expect(meter).toHaveAttribute('aria-valuemax', '3');
});

test('sizes the indicator to the value', () => {
  render(<Meter label="2 free doc(s) left." value={1} max={4} />);

  const indicator = screen.getByRole('meter')
    .querySelector('.bg-pca-orange-500');

  expect(indicator).toHaveStyle({ width: '25%' });
});
