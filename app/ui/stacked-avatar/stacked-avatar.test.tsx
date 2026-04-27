import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StackedAvatars } from './stacked-avatar';

const avatars = [
  { name: 'Alice', color: '#E74C3C' },
  { name: 'Bob', color: '#3498DB' },
  { name: 'Charlie', color: '#2ECC71' },
  { name: 'Diana', color: '#F39C12' },
  { name: 'Eve', color: '#9B59B6' },
  { name: 'Frank', color: '#1ABC9C' },
  { name: 'Grace', color: '#E67E22' },
];

describe('StackedAvatars', () => {
  test('matches snapshot', () => {
    const { container } = render(<StackedAvatars avatars={avatars} />);

    expect(container).toMatchSnapshot();
  });

  test('renders all avatars inline when there is no overflow', () => {
    render(<StackedAvatars avatars={avatars.slice(0, 3)} />);

    expect(screen.getByLabelText('Alice')).toBeInTheDocument();
    expect(screen.getByLabelText('Bob')).toBeInTheDocument();
    expect(screen.getByLabelText('Charlie')).toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('renders overflow indicator and only visible avatars by default', () => {
    render(<StackedAvatars avatars={avatars} />);

    expect(screen.getByLabelText('Alice')).toBeInTheDocument();
    expect(screen.getByLabelText('Bob')).toBeInTheDocument();
    expect(screen.getByLabelText('Charlie')).toBeInTheDocument();
    expect(screen.getByLabelText('Diana')).toBeInTheDocument();
    expect(screen.getByLabelText('Eve')).toBeInTheDocument();
    expect(screen.queryByLabelText('Frank')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Grace')).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  test('opens dropdown and shows all avatar names on overflow trigger click', async () => {
    const user = userEvent.setup();
    render(<StackedAvatars avatars={avatars} />);

    const trigger = screen.getByText('+').closest('button');
    expect(trigger).not.toBeNull();

    await user.click(trigger as HTMLButtonElement);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();
    expect(screen.getByText('Frank')).toBeInTheDocument();
    expect(screen.getByText('Grace')).toBeInTheDocument();
  });
});
