import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoiceTrigger } from './choice-trigger';

describe('ChoiceTrigger', () => {
  test('renders its label', () => {
    render(<ChoiceTrigger>Can edit</ChoiceTrigger>);
    expect(screen.getByRole('button', { name: 'Can edit' }))
      .toBeInTheDocument();
  });

  test('renders the caret', () => {
    const { container } = render(<ChoiceTrigger>Can edit</ChoiceTrigger>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('defaults to a non-submitting button', () => {
    render(<ChoiceTrigger>Can edit</ChoiceTrigger>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  test('calls onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ChoiceTrigger onClick={onClick}>Can edit</ChoiceTrigger>);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  test('prefers an explicit label over its content', () => {
    render(<ChoiceTrigger aria-label="Access for Sam">Can edit</ChoiceTrigger>);
    expect(screen.getByRole('button', { name: 'Access for Sam' }))
      .toBeInTheDocument();
  });

  test('can be disabled', () => {
    render(<ChoiceTrigger disabled={true}>Can edit</ChoiceTrigger>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
