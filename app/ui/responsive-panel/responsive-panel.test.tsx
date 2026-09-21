import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { Button } from '../button/button';
import { ResponsivePanel, ResponsivePanelTrigger } from './responsive-panel';
import { ResponsivePanelContent } from './responsive-panel-content';
import type { ResponsivePanelContentProps } from './responsive-panel-content';

vi.mock('~/hooks/use-is-mobile');

function renderResponsivePanel(
  { contentProps, defaultOpen }:
  {
    contentProps?: Partial<ResponsivePanelContentProps>;
    defaultOpen?: boolean;
  } = {},
) {
  return render(
    <ResponsivePanel defaultOpen={defaultOpen}>
      <ResponsivePanelTrigger>
        <Button type="button">Share</Button>
      </ResponsivePanelTrigger>
      <ResponsivePanelContent title="Share document" {...contentProps}>
        <p>Panel content</p>
      </ResponsivePanelContent>
    </ResponsivePanel>,
  );
}

describe('ResponsivePanel', () => {
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
      renderResponsivePanel();

      expect(
        screen.getByRole('button', { name: 'Share' }),
      ).toBeInTheDocument();
    });

    test('keeps the panel closed by default', () => {
      renderResponsivePanel();

      expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    });

    test('opens the panel from the trigger', async () => {
      const user = userEvent.setup();
      renderResponsivePanel();

      await user.click(screen.getByRole('button', { name: 'Share' }));

      expect(screen.getByText('Share document')).toBeInTheDocument();
      expect(screen.getByText('Panel content')).toBeInTheDocument();
    });

    test('renders the footer area', () => {
      renderResponsivePanel({
        defaultOpen: true,
        contentProps: { footerArea: <button type="button">Copy link</button> },
      });

      expect(
        screen.getByRole('button', { name: 'Copy link' }),
      ).toBeInTheDocument();
    });

    test('closes on Escape', async () => {
      const user = userEvent.setup();
      renderResponsivePanel({ defaultOpen: true });

      await user.keyboard('{Escape}');

      expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    });
  });

  describe('on desktop', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(false);
    });

    test('caps the popup at the height Radix leaves below the trigger', () => {
      renderResponsivePanel({ defaultOpen: true });

      expect(screen.getByText('Panel content').parentElement?.parentElement)
        .toHaveClass(
          'max-h-(--radix-dropdown-menu-content-available-height)',
        );
    });

    test('has no close button, since the trigger closes it again', () => {
      renderResponsivePanel({ defaultOpen: true });

      expect(
        screen.queryByRole('button', { name: 'Close' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('on mobile', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true);
    });

    test('closes the sheet from its close button', async () => {
      const user = userEvent.setup();
      renderResponsivePanel({ defaultOpen: true });

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    });

    test('caps the sheet at the given max height', () => {
      renderResponsivePanel({
        defaultOpen: true,
        contentProps: { maxHeight: 'calc(100dvh - 56px)' },
      });

      expect(
        screen.getByRole('dialog').style.getPropertyValue(
          '--drawer-max-height',
        ),
      ).toBe('calc(100dvh - 56px)');
    });
  });
});
