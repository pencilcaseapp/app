import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { href, RouterContextProvider } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  optionalUserSessionContext,
  userSessionContext,
} from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';

const openDocumentMock = vi.fn().mockResolvedValue([null, {
  title: 'The Document',
  shared: false,
  isOwner: true,
  hasJoined: false,
}]);

vi.mock('~/services/document', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('~/services/document')>(),
    openDocument: (...args: unknown[]) => openDocumentMock(...args),
  };
});

const setIsSidebarOpenMock = vi.fn();

vi.mock('~/ui/sidebar-context/use-sidebar-context', () => ({
  useSidebarContext: () => ({
    isSidebarOpen: false,
    setIsSidebarOpen: setIsSidebarOpenMock,
    triggerRef: { current: null },
    closeOnNavigate: vi.fn(),
  }),
}));

const MOBILE_QUERY = '(width < 40rem)';
const SIDE_NAVIGATION_QUERY = '(width >= 64rem)';

const useMediaMock = vi.fn();

vi.mock('react-use', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('react-use')>(),
    useMedia: (query: string) => useMediaMock(query),
  };
});

type Viewport = 'mobile' | 'tablet' | 'desktop';

const mockViewport = (viewport: Viewport) => {
  useMediaMock.mockImplementation((query: string) => {
    if (viewport === 'mobile') {
      return query === MOBILE_QUERY;
    }
    if (viewport === 'desktop') {
      return query === SIDE_NAVIGATION_QUERY;
    }
    return false;
  });
};

const DOC_ID = '11111111-2222-4333-8444-555555555555';

type SettingsPath
  = '/doc/:id'
    | '/doc/:id/settings'
    | '/doc/:id/settings/account'
    | '/doc/:id/settings/subscription'
    | '/doc/:id/settings/support';

async function renderSettings(path: SettingsPath, viewport: Viewport) {
  mockViewport(viewport);

  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  context.set(userSessionContext, userFixture);

  await renderRoute(path, {
    params: { id: DOC_ID },
    context,
    ...(path === '/doc/:id' ? {} : { parentRoute: '/doc/:id' }),
  });

  return userEvent.setup();
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('the settings routes', () => {
  test('keep the dialog closed on the document route', async () => {
    await renderSettings('/doc/:id', 'tablet');

    expect(
      await screen.findByRole('button', { name: 'Share' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('stacked below the side navigation breakpoint', () => {
    test('open on the menu page', async () => {
      await renderSettings('/doc/:id/settings', 'tablet');

      expect(
        await screen.findByRole('dialog', { name: 'Settings' }),
      ).toBeInTheDocument();
      expect(screen.getByText(userFixture.name!)).toBeInTheDocument();
      for (const section of ['Account', 'Subscription', 'Support']) {
        expect(
          screen.getByRole('link', { name: section }),
        ).toBeInTheDocument();
      }
      expect(
        screen.getByRole('link', { name: 'Logout' }),
      ).toHaveAttribute('href', href('/signout'));
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });

    test('navigate into a section and back through the topbar',
      async () => {
        const person = await renderSettings('/doc/:id/settings', 'tablet');

        await person.click(
          await screen.findByRole('link', { name: 'Account' }),
        );

        expect(
          await screen.findByRole('dialog', { name: 'Account' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Name'))
          .toHaveValue(userFixture.name);
        expect(
          screen.getByRole('button', { name: 'Save' }),
        ).toBeInTheDocument();

        await person.click(screen.getByRole('button', { name: 'Back' }));

        expect(
          await screen.findByRole('dialog', { name: 'Settings' }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: 'Back' }),
        ).not.toBeInTheDocument();
      });

    test('link to support through a mailto', async () => {
      await renderSettings('/doc/:id/settings/support', 'tablet');

      expect(
        await screen.findByRole('link', { name: 'inbox@pencilcase.app' }),
      ).toHaveAttribute('href', 'mailto:inbox@pencilcase.app');
    });

    test('deep link into a section', async () => {
      await renderSettings('/doc/:id/settings/subscription', 'tablet');

      expect(
        await screen.findByRole('dialog', { name: 'Subscription' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Upgrade to Pro' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });

    test('close through the cancel button and return to the document',
      async () => {
        const person
          = await renderSettings('/doc/:id/settings/account', 'tablet');

        await person.click(
          await screen.findByRole('button', { name: 'Cancel' }),
        );

        await waitFor(() => {
          expect(
            screen.queryByRole('dialog'),
          ).not.toBeInTheDocument();
        });
        expect(
          screen.getByRole('button', { name: 'Share' }),
        ).toBeInTheDocument();
      });
  });

  describe('with the side navigation', () => {
    // The sidebar links straight into the account section off mobile,
    // which is the same URL a section deep link opens.
    test('open the account section without the back button',
      async () => {
        await renderSettings('/doc/:id/settings/account', 'desktop');

        expect(await screen.findByLabelText('Name'))
          .toHaveValue(userFixture.name);
        expect(
          screen.getByRole('link', { name: 'Account' }),
        ).toHaveAttribute('aria-current', 'page');
        expect(
          screen.queryByRole('button', { name: 'Back' }),
        ).not.toBeInTheDocument();
      });

    test('still render the menu page for the settings URL itself',
      async () => {
        await renderSettings('/doc/:id/settings', 'desktop');

        expect(
          await screen.findByRole('dialog', { name: 'Settings' }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: 'Account' }),
        ).toBeInTheDocument();
      });

    test('switch sections through the side navigation', async () => {
      const person
        = await renderSettings('/doc/:id/settings/account', 'desktop');

      await person.click(
        await screen.findByRole('link', { name: 'Support' }),
      );

      expect(
        await screen.findByRole('heading', { name: 'How can we help?' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Support' }),
      ).toHaveAttribute('aria-current', 'page');
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });

    // The popup lives in the settings route above the sections, so
    // switching sections swaps the content inside the open dialog
    // instead of remounting it.
    test('keep the same popup mounted across sections', async () => {
      const person
        = await renderSettings('/doc/:id/settings/account', 'desktop');

      const popup = await screen.findByRole('dialog', { name: 'Account' });

      await person.click(screen.getByRole('link', { name: 'Support' }));

      expect(
        await screen.findByRole('dialog', { name: 'Support' }),
      ).toBe(popup);
    });
  });

  describe('on mobile', () => {
    test('render the stacked pages in the drawer variant', async () => {
      await renderSettings('/doc/:id/settings', 'mobile');

      expect(
        await screen.findByRole('dialog', { name: 'Settings' }),
      ).toHaveClass('rounded-t-3xl');
    });

    // The drawer stacks on the sidebar it is opened from, so a direct
    // load has to open the sidebar underneath itself.
    test('open the sidebar under the drawer', async () => {
      await renderSettings('/doc/:id/settings', 'mobile');

      expect(setIsSidebarOpenMock).toHaveBeenCalledWith(true);
    });

    test('leave the sidebar alone off mobile', async () => {
      await renderSettings('/doc/:id/settings/account', 'tablet');

      expect(setIsSidebarOpenMock).not.toHaveBeenCalled();
    });
  });
});
