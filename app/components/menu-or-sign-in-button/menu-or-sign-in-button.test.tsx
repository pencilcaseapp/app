import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuOrSignInButton } from './menu-or-sign-in-button';

const useSidebarContextMock = vi.fn();

vi.mock('~/ui/sidebar-context/use-sidebar-context', () => ({
  useSidebarContext: () => useSidebarContextMock(),
}));

vi.mock('react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('MenuOrSignInButton', () => {
  describe('when no signInUrl is provided', () => {
    it('renders a sidebar toggle button with the closed state label', () => {
      const setIsSidebarOpen = vi.fn();
      useSidebarContextMock.mockReturnValue({
        isSidebarOpen: false,
        setIsSidebarOpen,
        triggerRef: { current: null },
      });

      render(<MenuOrSignInButton />);

      expect(
        screen.getByRole('button', { name: 'Open navigation' }),
      ).toBeInTheDocument();
    });

    it('renders the open state label when the sidebar is open', () => {
      useSidebarContextMock.mockReturnValue({
        isSidebarOpen: true,
        setIsSidebarOpen: vi.fn(),
        triggerRef: { current: null },
      });

      render(<MenuOrSignInButton />);

      expect(
        screen.getByRole('button', { name: 'Close navigation' }),
      ).toBeInTheDocument();
    });

    it('toggles the sidebar open state when clicked', async () => {
      const setIsSidebarOpen = vi.fn();
      useSidebarContextMock.mockReturnValue({
        isSidebarOpen: false,
        setIsSidebarOpen,
        triggerRef: { current: null },
      });

      render(<MenuOrSignInButton />);

      await userEvent.click(
        screen.getByRole('button', { name: 'Open navigation' }),
      );

      expect(setIsSidebarOpen).toHaveBeenCalledWith(true);
    });

    it('does not render a sign in link', () => {
      useSidebarContextMock.mockReturnValue({
        isSidebarOpen: false,
        setIsSidebarOpen: vi.fn(),
        triggerRef: { current: null },
      });

      render(<MenuOrSignInButton />);

      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });
  });

  describe('when signInUrl is provided', () => {
    it('renders a sign in link instead of the sidebar toggle', () => {
      useSidebarContextMock.mockReturnValue({
        isSidebarOpen: false,
        setIsSidebarOpen: vi.fn(),
        triggerRef: { current: null },
      });

      render(<MenuOrSignInButton signInUrl="/sign-in" />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Open navigation' }),
      ).not.toBeInTheDocument();
    });
  });
});
