import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NativeSelect } from './native-select';

const items = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Something else' },
];

describe('NativeSelect', () => {
  test('renders the select with label', () => {
    const { container } = render(
      <NativeSelect id="reason" label="Reason" items={items} value="spam" />,
    );

    expect(container).toMatchSnapshot();
  });

  test('shows the placeholder until an item is chosen', () => {
    render(
      <NativeSelect
        id="reason"
        label="Reason"
        items={items}
        placeholder="Choose a reason"
      />,
    );

    const select = screen.getByLabelText('Reason') as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(select.selectedOptions[0]).toHaveTextContent('Choose a reason');
  });

  test('reports the chosen item', async () => {
    const onValueChange = vi.fn();
    render(
      <NativeSelect
        id="reason"
        label="Reason"
        items={items}
        onValueChange={onValueChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Reason'), 'other');

    expect(onValueChange).toHaveBeenCalledWith('other');
  });

  test('submits the value under its name', () => {
    const { container } = render(
      <form>
        <NativeSelect id="r" name="reason" items={items} value="spam" />
      </form>,
    );

    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('reason')).toBe('spam');
  });
});
