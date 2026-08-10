import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyLinkButton } from './copy-link-button';

const link = 'https://pencilcase.app/doc/42';

function renderButton(props: Partial<
  React.ComponentProps<typeof CopyLinkButton>
> = {}) {
  /*
   * `userEvent.setup()` installs a clipboard stub on the window, so it has to
   * run before we spy on `writeText`.
   */
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, 'writeText');

  const result = render(
    <CopyLinkButton
      link={link}
      label="Copy link"
      copiedLabel="Link copied!"
      {...props}
    />,
  );

  return { ...result, user, writeText };
}

describe('CopyLinkButton', () => {
  test('renders the given label', () => {
    renderButton();

    expect(
      screen.getByRole('button', { name: 'Copy link' }),
    ).toBeInTheDocument();
  });

  test('writes the link to the clipboard when clicked', async () => {
    const { user, writeText } = renderButton();

    await user.click(screen.getByRole('button'));

    expect(writeText).toHaveBeenCalledExactlyOnceWith(link);
  });

  test('shows the copied label after copying', async () => {
    const { user } = renderButton();

    await user.click(screen.getByRole('button'));

    expect(
      await screen.findByRole('button', { name: 'Link copied!' }),
    ).toBeInTheDocument();
  });

  test('calls onCopy with the link', async () => {
    const onCopy = vi.fn();
    const { user } = renderButton({ onCopy });

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(onCopy).toHaveBeenCalledExactlyOnceWith(link);
    });
  });

  test('returns to the idle label after copiedDuration', async () => {
    const { user } = renderButton({ copiedDuration: 10 });

    await user.click(screen.getByRole('button'));
    expect(
      await screen.findByRole('button', { name: 'Link copied!' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Copy link' }),
      ).toBeInTheDocument();
    });
  });

  test('still calls a custom onClick handler', async () => {
    const onClick = vi.fn();
    const { user } = renderButton({ onClick });

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  test('does not copy when disabled', async () => {
    const { user, writeText } = renderButton({ disabled: true });

    expect(screen.getByRole('button')).toBeDisabled();

    await user.click(screen.getByRole('button'));

    expect(writeText).not.toHaveBeenCalled();
  });

  describe('snapshots', () => {
    test('default state', () => {
      const { container } = renderButton();

      expect(container).toMatchSnapshot();
    });

    test('copied state', async () => {
      const { container, user } = renderButton();

      await user.click(screen.getByRole('button'));
      await screen.findByRole('button', { name: 'Link copied!' });

      expect(container).toMatchSnapshot();
    });

    test('disabled state', () => {
      const { container } = renderButton({ disabled: true });

      expect(container).toMatchSnapshot();
    });
  });
});
