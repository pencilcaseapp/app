import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SettingsDialog } from './settings-dialog';
import type { SettingsPage } from './settings-dialog';

const MOBILE_QUERY = '(width < 40rem)';
const SIDE_NAVIGATION_QUERY = '(width >= 64rem)';

const useMediaMock = vi.fn();

vi.mock('react-use', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('react-use')>(),
    useMedia: (query: string) => useMediaMock(query),
  };
});

const mockViewport = (viewport: 'mobile' | 'tablet' | 'desktop') => {
  useMediaMock.mockImplementation((query: string) => {
    if (viewport === 'mobile') return query === MOBILE_QUERY;
    if (viewport === 'desktop') return query === SIDE_NAVIGATION_QUERY;
    return false;
  });
};

const user = {
  name: 'John Doe',
  email: 'john@pencilcase.app',
  newsletter: true,
};

const onOpenChange = vi.fn();
const onPageChange = vi.fn();

function renderDialog(
  { open = true, page = 'menu' }:
  { open?: boolean; page?: SettingsPage } = {},
) {
  // The page is controlled (the layout derives it from the URL), so the
  // harness feeds page changes back in the way the router would.
  function Harness() {
    const [currentPage, setCurrentPage] = useState<SettingsPage>(page);

    return (
      <SettingsDialog
        user={user}
        open={open}
        page={currentPage}
        onOpenChange={onOpenChange}
        onPageChange={(nextPage) => {
          onPageChange(nextPage);
          setCurrentPage(nextPage);
        }}
      />
    );
  }

  return render(<Harness />);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('SettingsDialog', () => {
  test('renders nothing while closed', () => {
    mockViewport('tablet');
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('stacked below the side navigation breakpoint', () => {
    test('opens on the menu page', () => {
      mockViewport('tablet');
      renderDialog();

      expect(
        screen.getByRole('dialog', { name: 'Settings' }),
      ).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@pencilcase.app')).toBeInTheDocument();
      for (const item of ['Account', 'Subscription', 'Support', 'Logout']) {
        expect(
          screen.getByRole('button', { name: item }),
        ).toBeInTheDocument();
      }
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });

    test('pushes the account page and returns through back', async () => {
      const person = userEvent.setup();
      mockViewport('tablet');
      renderDialog();

      await person.click(screen.getByRole('button', { name: 'Account' }));

      expect(onPageChange).toHaveBeenCalledWith('account');
      expect(
        screen.getByRole('dialog', { name: 'Account' }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
      expect(
        screen.getByLabelText('Subscribe to Newsletter'),
      ).toBeChecked();
      expect(
        screen.getByRole('button', { name: 'Save' }),
      ).toBeInTheDocument();

      await person.click(screen.getByRole('button', { name: 'Back' }));

      expect(
        screen.getByRole('dialog', { name: 'Settings' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Back' }),
      ).not.toBeInTheDocument();
    });

    test('pushes a placeholder section page', async () => {
      const person = userEvent.setup();
      mockViewport('tablet');
      renderDialog();

      await person.click(
        screen.getByRole('button', { name: 'Subscription' }),
      );

      expect(
        screen.getByRole('dialog', { name: 'Subscription' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('The Subscription settings live here.'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });

    test('closes through the cancel button', async () => {
      const person = userEvent.setup();
      mockViewport('tablet');
      renderDialog();

      await person.click(screen.getByRole('button', { name: 'Account' }));
      await person.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    });
  });

  describe('with the side navigation', () => {
    test('opens on the account section without a menu', () => {
      mockViewport('desktop');
      renderDialog();

      expect(
        screen.getByRole('dialog', { name: 'Account' }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
      expect(
        screen.getByRole('button', { name: 'Account' }),
      ).toHaveAttribute('aria-current', 'page');
      expect(
        screen.queryByRole('button', { name: 'Back' }),
      ).not.toBeInTheDocument();
    });

    test('switches sections through the side navigation', async () => {
      const person = userEvent.setup();
      mockViewport('desktop');
      renderDialog();

      await person.click(screen.getByRole('button', { name: 'Support' }));

      expect(
        screen.getByRole('dialog', { name: 'Support' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('The Support settings live here.'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Support' }),
      ).toHaveAttribute('aria-current', 'page');
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('on mobile', () => {
    test('renders the stacked pages in the drawer variant', async () => {
      const person = userEvent.setup();
      mockViewport('mobile');
      renderDialog();

      expect(
        screen.getByRole('dialog', { name: 'Settings' }),
      ).toHaveClass('rounded-t-3xl');

      await person.click(screen.getByRole('button', { name: 'Account' }));

      expect(
        screen.getByRole('dialog', { name: 'Account' }),
      ).toBeInTheDocument();
    });
  });
});
