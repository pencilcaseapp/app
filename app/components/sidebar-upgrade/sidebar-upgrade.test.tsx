import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { IconOnlyContext } from '~/ui/navigation-item/icon-only-context';
import { SidebarUpgrade } from './sidebar-upgrade';

const closeOnNavigate = vi.fn();

vi.mock('~/ui/sidebar-context/use-sidebar-context', () => ({
  useSidebarContext: () => ({ closeOnNavigate }),
}));

vi.mock('react-router', () => ({
  href: (path: string) => path,
  Link: ({ to, children, ...props }: {
    to: string;
    children: React.ReactNode;
  }) => <a href={to} {...props}>{children}</a>,
}));

test('renders meter and upgrade button', () => {
  const { container } = render(
    <SidebarUpgrade documentCount={2} documentLimit={3} />,
  );

  expect(container).toMatchSnapshot();
});

test('shows the remaining free documents', () => {
  render(<SidebarUpgrade documentCount={2} documentLimit={3} />);

  expect(screen.getByText('1 free doc(s) left.')).toBeInTheDocument();

  const meter = screen.getByRole('meter');

  expect(meter).toHaveAttribute('aria-valuenow', '2');
  expect(meter).toHaveAttribute('aria-valuemax', '3');
});

test('does not report negative remaining documents', () => {
  render(<SidebarUpgrade documentCount={5} documentLimit={3} />);

  expect(screen.getByText('0 free doc(s) left.')).toBeInTheDocument();
  expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '3');
});

test('links to the upgrade page', () => {
  render(<SidebarUpgrade documentCount={2} documentLimit={3} />);

  expect(screen.getByRole('link', { name: 'Upgrade to Pro' }))
    .toHaveAttribute('href', '/upgrade');
});

test('renders nothing in the icon-only sidebar', () => {
  const { container } = render(
    <IconOnlyContext value={true}>
      <SidebarUpgrade documentCount={2} documentLimit={3} />
    </IconOnlyContext>,
  );

  expect(container).toBeEmptyDOMElement();
});
