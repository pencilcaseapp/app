import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { IconOnlyContext } from '~/ui/navigation-item/icon-only-context';
import { SidebarUpgrade } from './sidebar-upgrade';

const closeOnNavigate = vi.fn();

vi.mock('~/ui/sidebar-context/use-sidebar-context', () => ({
  useSidebarContext: () => ({ closeOnNavigate }),
}));

vi.mock('react-router', () => ({
  Link: ({ to, preventScrollReset, children, ...props }: {
    to: string;
    preventScrollReset?: boolean;
    children: React.ReactNode;
  }) => (
    <a
      href={to}
      data-prevent-scroll-reset={preventScrollReset}
      {...props}
    >
      {children}
    </a>
  ),
}));

const upgradeUrl = '/doc/123/settings/subscription';

test('renders meter and upgrade button', () => {
  const { container } = render(
    <SidebarUpgrade documentCount={2} documentLimit={3} to={upgradeUrl} />,
  );

  expect(container).toMatchSnapshot();
});

test('shows the remaining free documents', () => {
  render(
    <SidebarUpgrade documentCount={2} documentLimit={3} to={upgradeUrl} />,
  );

  expect(screen.getByText('1 free doc(s) left.')).toBeInTheDocument();

  const meter = screen.getByRole('meter');

  expect(meter).toHaveAttribute('aria-valuenow', '2');
  expect(meter).toHaveAttribute('aria-valuemax', '3');
});

test('does not report negative remaining documents', () => {
  render(
    <SidebarUpgrade documentCount={5} documentLimit={3} to={upgradeUrl} />,
  );

  expect(screen.getByText('0 free doc(s) left.')).toBeInTheDocument();
  expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '3');
});

test('links to the subscription settings', () => {
  render(
    <SidebarUpgrade documentCount={2} documentLimit={3} to={upgradeUrl} />,
  );

  const link = screen.getByRole('link', { name: 'Upgrade to Pro' });

  expect(link).toHaveAttribute('href', upgradeUrl);
  expect(link).toHaveAttribute('data-prevent-scroll-reset', 'true');
});

test('renders nothing in the icon-only sidebar', () => {
  const { container } = render(
    <IconOnlyContext value={true}>
      <SidebarUpgrade
        documentCount={2}
        documentLimit={3}
        to={upgradeUrl}
      />
    </IconOnlyContext>,
  );

  expect(container).toBeEmptyDOMElement();
});
