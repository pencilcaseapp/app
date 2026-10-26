import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup } from './radio-group';

const items = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Something else' },
];

describe('RadioGroup', () => {
  test('names the group after its label', () => {
    render(<RadioGroup label="Reason" items={items} />);

    expect(screen.getByRole('radiogroup', { name: 'Reason' }))
      .toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  test('reports the row that was picked', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup label="Reason" items={items} onValueChange={onValueChange} />,
    );

    await userEvent.click(screen.getByText('Something else'));

    expect(onValueChange).toHaveBeenCalledWith('other');
  });

  test('submits the value under its name', () => {
    const { container } = render(
      <form>
        <RadioGroup name="reason" label="Reason" items={items} value="spam" />
      </form>,
    );

    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('reason')).toBe('spam');
  });
});
