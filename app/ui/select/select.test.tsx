import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './select';

const roles = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];

function renderSelect(props: Partial<Parameters<typeof Select>[0]> = {}) {
  return render(
    <Select
      aria-label="Access"
      items={roles}
      defaultValue="view"
      {...props}
    />,
  );
}

describe('Select', () => {
  test('renders the label of the selected item', () => {
    renderSelect();
    expect(screen.getByRole('combobox')).toHaveTextContent('Can view');
  });

  test('does not show the list by default', () => {
    renderSelect();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('opens the list on trigger click', async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Can view' }))
      .toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Can edit' }))
      .toBeInTheDocument();
  });

  test('marks the selected option', async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: 'Can view' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('reports the chosen value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Can edit' }));

    expect(onValueChange).toHaveBeenCalledWith('edit');
  });

  test('submits the value through a hidden input', () => {
    const { container } = renderSelect({ name: 'role' });

    expect(container.querySelector('input[name="role"]'))
      .toHaveValue('view');
  });

  test('renders a visible label', () => {
    render(<Select label="Link access" items={roles} defaultValue="view" />);
    expect(screen.getByText('Link access')).toBeInTheDocument();
  });

  test('does not open when disabled', async () => {
    const user = userEvent.setup();
    renderSelect({ disabled: true });

    await user.click(screen.getByRole('combobox'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('renders the glassy surface by default', async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox').closest('[class*="glass-surface"]'))
      .toBeInTheDocument();
  });

  test('gives the popup the min width from the design concept', async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox').parentElement)
      .toHaveClass('min-w-[max(12rem,var(--anchor-width))]');
  });

  test('renders a solid surface for the solid variant', async () => {
    const user = userEvent.setup();
    renderSelect({ variant: 'solid' });

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox').closest('[class*="glass-surface"]'))
      .not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Can view' }))
      .toHaveClass('data-highlighted:bg-pca-grey-200');
  });
});
