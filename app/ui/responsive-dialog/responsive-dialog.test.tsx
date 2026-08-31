import { useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from './responsive-dialog';
import { ResponsiveDialogContent } from './responsive-dialog-content';
import type {
  ResponsiveDialogContentProps,
} from './responsive-dialog-content';
import {
  ResponsiveDialogContentInner,
} from './responsive-dialog-content-inner';
import type {
  ResponsiveDialogContentInnerProps,
} from './responsive-dialog-content-inner';
import { useIsMobile } from '~/hooks/use-is-mobile';

vi.mock('~/hooks/use-is-mobile');

function renderResponsiveDialog(
  { contentProps, innerProps, defaultOpen }:
  {
    contentProps?: ResponsiveDialogContentProps;
    innerProps?: ResponsiveDialogContentInnerProps;
    defaultOpen?: boolean;
  } = {},
) {
  return render(
    <ResponsiveDialog defaultOpen={defaultOpen}>
      <ResponsiveDialogTrigger>Open</ResponsiveDialogTrigger>
      <ResponsiveDialogContent {...contentProps}>
        <ResponsiveDialogContentInner {...innerProps}>
          <ResponsiveDialogTitle>Delete document</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            This action cannot be undone.
          </ResponsiveDialogDescription>
          {innerProps?.children}
        </ResponsiveDialogContentInner>
      </ResponsiveDialogContent>
    </ResponsiveDialog>,
  );
}

describe('ResponsiveDialog', () => {
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

    test('renders the trigger', () => {
      renderResponsiveDialog();

      expect(
        screen.getByRole('button', { name: 'Open' }),
      ).toBeInTheDocument();
    });

    test('does not show the content by default', () => {
      renderResponsiveDialog();

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('opens on trigger click', async () => {
      const user = userEvent.setup();
      renderResponsiveDialog();

      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete document')).toBeInTheDocument();
      expect(
        screen.getByText('This action cannot be undone.'),
      ).toBeInTheDocument();
    });

    test('labels the popup with the title', () => {
      renderResponsiveDialog({ defaultOpen: true });

      expect(
        screen.getByRole('dialog', { name: 'Delete document' }),
      ).toBeInTheDocument();
    });

    test('closes on Escape', async () => {
      const user = userEvent.setup();
      renderResponsiveDialog({ defaultOpen: true });

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('is fully controllable via open and onOpenChange', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      function Controlled() {
        const [open, setOpen] = useState(false);

        return (
          <ResponsiveDialog
            open={open}
            onOpenChange={(nextOpen) => {
              onOpenChange(nextOpen);
              setOpen(nextOpen);
            }}
          >
            <ResponsiveDialogTrigger>Open</ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogTitle>Settings</ResponsiveDialogTitle>
              <ResponsiveDialogClose>Close</ResponsiveDialogClose>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        );
      }

      render(<Controlled />);

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders the top and footer areas', () => {
      renderResponsiveDialog({
        defaultOpen: true,
        innerProps: {
          topArea: <span>Top area content</span>,
          footerArea: <button type="button">Save</button>,
        },
      });

      expect(screen.getByText('Top area content')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Save' }),
      ).toBeInTheDocument();
    });
  });

  describe('on desktop', () => {
    test('renders the dialog variant', () => {
      renderResponsiveDialog({ defaultOpen: true });

      expect(screen.getByRole('dialog')).toHaveClass('rounded-3xl');
    });

    test('applies the class of the requested size', () => {
      renderResponsiveDialog({
        defaultOpen: true,
        contentProps: { size: 'large' },
      });

      expect(screen.getByRole('dialog')).toHaveClass('max-w-3xl');
    });

    test('renders the side area', () => {
      renderResponsiveDialog({
        defaultOpen: true,
        innerProps: { sideArea: <span>Side content</span> },
      });

      expect(screen.getByText('Side content')).toBeInTheDocument();
    });
  });

  describe('on mobile', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true);
    });

    test('renders the drawer variant', () => {
      renderResponsiveDialog({ defaultOpen: true });

      expect(screen.getByRole('dialog')).toHaveClass('rounded-t-3xl');
    });

    test('reserves footer height based on reservedFooterHeight', () => {
      renderResponsiveDialog({
        defaultOpen: true,
        innerProps: {
          reservedFooterHeight: 96,
          footerArea: <button type="button">Save</button>,
        },
      });

      const footer = screen.getByRole('button', { name: 'Save' })
        .parentElement?.parentElement;

      expect(
        footer?.style.getPropertyValue('--footer-reserved-height'),
      ).toBe(
        'calc(96px + env(safe-area-inset-bottom, 0px) + var(--bleed))',
      );
    });
  });
});
