import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './switch';

test('renders with label', () => {
  const { container } = render(
    <Switch id="test" label="Test Label" />,
  );

  expect(container).toMatchSnapshot();
});

test('renders checked state', () => {
  const { container } = render(
    <Switch id="test" label="Test Label" checked />,
  );

  expect(container).toMatchSnapshot();
});

test('renders disabled state', () => {
  const { container } = render(
    <Switch id="test" label="Test Label" disabled />,
  );

  expect(container).toMatchSnapshot();
});

test('renders disabled checked state', () => {
  const { container } = render(
    <Switch id="test" label="Test Label" disabled checked />,
  );

  expect(container).toMatchSnapshot();
});

test('renders error state', () => {
  const { container } = render(
    <Switch id="test" label="Test Label" errorMessage="Error message" />,
  );

  expect(container).toMatchSnapshot();
});

test('renders hint text', () => {
  const { container } = render(
    <Switch id="test" label="Test Label" hint="Hint text" />,
  );

  expect(container).toMatchSnapshot();
});

test('exposes the label as the accessible name', () => {
  render(<Switch id="test" label="Test Label" />);

  expect(screen.getByRole('switch', { name: 'Test Label' }))
    .toBeInTheDocument();
});

test('reflects the checked state to assistive technology', () => {
  render(<Switch id="test" label="Test Label" checked />);

  expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
});

test('calls onCheckedChange when toggled', async () => {
  const user = userEvent.setup();
  const onCheckedChange = vi.fn();

  render(
    <Switch id="test" label="Test Label" onCheckedChange={onCheckedChange} />,
  );

  await user.click(screen.getByRole('switch'));

  expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
});

test('toggles when the label is clicked', async () => {
  const user = userEvent.setup();
  const onCheckedChange = vi.fn();

  render(
    <Switch id="test" label="Test Label" onCheckedChange={onCheckedChange} />,
  );

  await user.click(screen.getByText('Test Label'));

  expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
});

test('does not call onCheckedChange when disabled', async () => {
  const user = userEvent.setup();
  const onCheckedChange = vi.fn();

  render(
    <Switch
      id="test"
      label="Test Label"
      disabled
      onCheckedChange={onCheckedChange}
    />,
  );

  await user.click(screen.getByRole('switch'));

  expect(onCheckedChange).not.toHaveBeenCalled();
});

test('links the error message to the switch', () => {
  render(
    <Switch id="test" label="Test Label" errorMessage="Error message" />,
  );

  const element = screen.getByRole('switch');

  expect(element).toHaveAttribute('aria-invalid', 'true');
  expect(element).toHaveAttribute('aria-errormessage', 'test-error');
  expect(screen.getByText('Error message')).toHaveAttribute('id', 'test-error');
});

test('links the hint to the switch', () => {
  render(<Switch id="test" label="Test Label" hint="Hint text" />);

  expect(screen.getByRole('switch'))
    .toHaveAttribute('aria-describedby', 'test-hint');
  expect(screen.getByText('Hint text')).toHaveAttribute('id', 'test-hint');
});

test('hides the hint when an error message is present', () => {
  render(
    <Switch
      id="test"
      label="Test Label"
      hint="Hint text"
      errorMessage="Error message"
    />,
  );

  expect(screen.queryByText('Hint text')).not.toBeInTheDocument();
});
