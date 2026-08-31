import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button/button';
import { UpgradeDialog } from './upgrade-dialog';
import { useIsMobile } from '~/hooks/use-is-mobile';

vi.mock('~/hooks/use-is-mobile');

const props = {
  headline: 'Need more docs?',
  description: 'You have reached the limits of the free plan.',
  pricingArea: <span>Pricing area content</span>,
  trigger: <Button colorLight="upgrade">Upgrade to Pro</Button>,
};

describe('UpgradeDialog', () => {
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

    test('opens on trigger click', async () => {
      const user = userEvent.setup();
      render(<UpgradeDialog {...props} />);

      await user.click(
        screen.getByRole('button', { name: 'Upgrade to Pro' }),
      );

      expect(
        screen.getByRole('dialog', { name: 'Upgrade to Pro' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Need more docs?' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('You have reached the limits of the free plan.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Pricing area content')).toBeInTheDocument();
    });

    test('closes through the close button', async () => {
      const user = userEvent.setup();
      render(<UpgradeDialog {...props} defaultOpen />);

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders without a description', () => {
      render(
        <UpgradeDialog
          {...props}
          description={undefined}
          defaultOpen
        />,
      );

      expect(
        screen.queryByText('You have reached the limits of the free plan.'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Pricing area content')).toBeInTheDocument();
    });

    test('is controllable via open and onOpenChange', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <UpgradeDialog
          {...props}
          open
          onOpenChange={nextOpen => onOpenChange(nextOpen)}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });
  });

  describe('on desktop', () => {
    test('renders the large dialog size by default', () => {
      render(<UpgradeDialog {...props} defaultOpen />);

      expect(screen.getByRole('dialog')).toHaveClass('max-w-3xl');
    });

    test('applies the requested dialog size', () => {
      render(<UpgradeDialog {...props} size="small" defaultOpen />);

      expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');
    });
  });
});
