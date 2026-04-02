import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './tooltip';

describe('Tooltip', () => {
  test('renders the trigger element', () => {
    render(
      <Tooltip tooltip="Helpful tip">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });

  test('does not show tooltip content by default', () => {
    render(
      <Tooltip tooltip="Helpful tip">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.queryByText('Helpful tip')).not.toBeInTheDocument();
  });

  test('shows tooltip content on hover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip tooltip="Helpful tip">
        <button>Hover me</button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole('button'));
    expect((await screen.findAllByText('Helpful tip')).length).toBeGreaterThan(0);
  });

  test('sets aria-describedby on trigger when tooltip is open', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip tooltip="Helpful tip">
        <button>Hover me</button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole('button'));
    await screen.findByRole('tooltip');
    expect(screen.getByRole('button')).toHaveAttribute('aria-describedby');
  });

  test('renders JSX as tooltip content', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip tooltip={<span data-testid="custom">Custom content</span>}>
        <button>Hover me</button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole('button'));
    expect((await screen.findAllByTestId('custom')).length).toBeGreaterThan(0);
  });
});
