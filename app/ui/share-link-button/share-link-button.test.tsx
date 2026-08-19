import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareLinkButton } from './share-link-button';

const link = 'https://pencilcase.app/doc/42';

function stubShare(implementation: () => Promise<void>) {
  const share = vi.fn(implementation);

  Object.defineProperty(navigator, 'share', {
    value: share,
    configurable: true,
    writable: true,
  });

  return share;
}

function renderButton(
  props: Partial<React.ComponentProps<typeof ShareLinkButton>> = {},
  implementation: () => Promise<void> = async () => {},
) {
  const user = userEvent.setup();
  const share = stubShare(implementation);

  const result = render(
    <ShareLinkButton link={link} label="Share link" {...props} />,
  );

  return { ...result, user, share };
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
});

describe('ShareLinkButton', () => {
  test('renders the given label', () => {
    renderButton();

    expect(
      screen.getByRole('button', { name: 'Share link' }),
    ).toBeInTheDocument();
  });

  test('opens the native share sheet with the link', async () => {
    const { user, share } = renderButton();

    await user.click(screen.getByRole('button'));

    expect(share).toHaveBeenCalledExactlyOnceWith({ url: link });
  });

  test('calls onShare with the link', async () => {
    const onShare = vi.fn();
    const { user } = renderButton({ onShare });

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(onShare).toHaveBeenCalledExactlyOnceWith(link);
    });
  });

  test('stays quiet when the share sheet is dismissed', async () => {
    const onShare = vi.fn();
    const { user } = renderButton({ onShare }, async () => {
      throw Object.assign(new Error('Share canceled'), { name: 'AbortError' });
    });

    await user.click(screen.getByRole('button'));

    expect(onShare).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Share link' }),
    ).toBeInTheDocument();
  });

  test('still calls a custom onClick handler', async () => {
    const onClick = vi.fn();
    const { user } = renderButton({ onClick });

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  test('does not share when disabled', async () => {
    const { user, share } = renderButton({ disabled: true });

    expect(screen.getByRole('button')).toBeDisabled();

    await user.click(screen.getByRole('button'));

    expect(share).not.toHaveBeenCalled();
  });

  describe('snapshots', () => {
    test('default state', () => {
      const { container } = renderButton();

      expect(container).toMatchSnapshot();
    });

    test('disabled state', () => {
      const { container } = renderButton({ disabled: true });

      expect(container).toMatchSnapshot();
    });
  });
});
