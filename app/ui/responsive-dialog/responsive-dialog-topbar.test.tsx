import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsiveDialog } from './responsive-dialog';
import { ResponsiveDialogContent } from './responsive-dialog-content';
import { ResponsiveDialogTopbar } from './responsive-dialog-topbar';
import type {
  ResponsiveDialogTopbarProps,
} from './responsive-dialog-topbar';
import { useIsMobile } from '~/hooks/use-is-mobile';

vi.mock('~/hooks/use-is-mobile');

function renderTopbar(topbarProps?: Partial<ResponsiveDialogTopbarProps>) {
  return render(
    <ResponsiveDialog defaultOpen>
      <ResponsiveDialogContent
        topArea={<ResponsiveDialogTopbar title="Settings" {...topbarProps} />}
      >
        Content
      </ResponsiveDialogContent>
    </ResponsiveDialog>,
  );
}

describe('ResponsiveDialogTopbar', () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false);
  });

  describe.each([
    { viewport: 'desktop', isMobile: false },
    { viewport: 'mobile', isMobile: true },
  ])('on $viewport', ({ isMobile }) => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(isMobile);
    });

    test('labels the popup with the title', () => {
      renderTopbar();

      expect(
        screen.getByRole('dialog', { name: 'Settings' }),
      ).toBeInTheDocument();
    });

    test('closes through the close button', async () => {
      const user = userEvent.setup();
      renderTopbar();

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('hides the back button without onBack', () => {
      renderTopbar();

      expect(
        screen.queryByRole('button', { name: 'Back' }),
      ).not.toBeInTheDocument();
    });

    test('calls onBack through the back button', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      renderTopbar({ onBack });

      await user.click(screen.getByRole('button', { name: 'Back' }));

      expect(onBack).toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
