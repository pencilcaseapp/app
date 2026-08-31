import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  createRoutesStub,
  Outlet,
  RouterContextProvider,
  type LoaderFunction,
} from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  optionalUserSessionContext,
  userSessionContext,
} from '~/contexts/user-session';
import LayoutEditor, { loader as layoutLoader } from '~/layouts/editor';
import { userFixture } from '~/test/fixtures/user';
import Settings, { loader as settingsLoader } from './settings';
import SettingsAccountRoute from './settings-account';
import SettingsMenuRoute from './settings-menu';
import SettingsSubscriptionRoute from './settings-subscription';
import SettingsSupportRoute from './settings-support';

vi.mock('~/repos/document', () => ({
  getDocumentList: vi.fn().mockResolvedValue([]),
}));

const MOBILE_QUERY = '(width < 40rem)';
const SIDE_NAVIGATION_QUERY = '(width >= 64rem)';
const SIDEBAR_MOBILE_QUERY = '(max-width: 640px)';
const SIDEBAR_DESKTOP_QUERY = '(min-width: 1280px)';

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
      return query === MOBILE_QUERY || query === SIDEBAR_MOBILE_QUERY;
    }
    if (viewport === 'desktop') {
      return query === SIDE_NAVIGATION_QUERY
        || query === SIDEBAR_DESKTOP_QUERY;
    }
    return false;
  });
};

const DOC_ID = '11111111-2222-4333-8444-555555555555';

function renderSettings(path: string, viewport: Viewport) {
  mockViewport(viewport);

  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  context.set(userSessionContext, userFixture);

  const Stub = createRoutesStub([
    {
      Component: LayoutEditor as React.ComponentType,
      loader: layoutLoader,
      children: [
        {
          path: 'doc/:id',
          Component: () => (
            <>
              <div>Document</div>
              <Outlet />
            </>
          ),
          children: [
            {
              path: 'settings',
              Component: Settings as React.ComponentType,
              loader: settingsLoader as unknown as LoaderFunction,
              children: [
                { index: true, Component: SettingsMenuRoute },
                { path: 'account', Component: SettingsAccountRoute },
                {
                  path: 'subscription',
                  Component: SettingsSubscriptionRoute,
                },
                { path: 'support', Component: SettingsSupportRoute },
              ],
            },
          ],
        },
      ],
    },
  ], context);

  return render(<Stub initialEntries={[path]} />);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('the settings routes', () => {
  test('keep the dialog closed on the document route', async () => {
    renderSettings(`/doc/${DOC_ID}`, 'tablet');

    expect(await screen.findByText('Document')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('stacked below the side navigation breakpoint', () => {
    test('open on the menu page', async () => {
      renderSettings(`/doc/${DOC_ID}/settings`, 'tablet');

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
        screen.getByRole('button', { name: 'Logout' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });

    test('navigate into a section and back through the topbar',
      async () => {
        const person = userEvent.setup();
        renderSettings(`/doc/${DOC_ID}/settings`, 'tablet');

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

    test('deep link into a section', async () => {
      renderSettings(`/doc/${DOC_ID}/settings/subscription`, 'tablet');

      expect(
        await screen.findByRole('dialog', { name: 'Subscription' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('The Subscription settings live here.'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });

    test('close through the cancel button and return to the document',
      async () => {
        const person = userEvent.setup();
        renderSettings(`/doc/${DOC_ID}/settings/account`, 'tablet');

        await person.click(
          await screen.findByRole('button', { name: 'Cancel' }),
        );

        await waitFor(() => {
          expect(
            screen.queryByRole('dialog'),
          ).not.toBeInTheDocument();
        });
        expect(screen.getByText('Document')).toBeInTheDocument();
      });
  });

  describe('with the side navigation', () => {
    test('the index replaces itself with the account section',
      async () => {
        renderSettings(`/doc/${DOC_ID}/settings`, 'desktop');

        expect(await screen.findByLabelText('Name'))
          .toHaveValue(userFixture.name);
        expect(
          screen.getByRole('link', { name: 'Account' }),
        ).toHaveAttribute('aria-current', 'page');
        expect(
          screen.queryByRole('button', { name: 'Back' }),
        ).not.toBeInTheDocument();
      });

    test('switch sections through the side navigation', async () => {
      const person = userEvent.setup();
      renderSettings(`/doc/${DOC_ID}/settings/account`, 'desktop');

      await person.click(
        await screen.findByRole('link', { name: 'Support' }),
      );

      expect(
        await screen.findByText('The Support settings live here.'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Support' }),
      ).toHaveAttribute('aria-current', 'page');
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('on mobile', () => {
    test('render the stacked pages in the drawer variant', async () => {
      renderSettings(`/doc/${DOC_ID}/settings`, 'mobile');

      expect(
        await screen.findByRole('dialog', { name: 'Settings' }),
      ).toHaveClass('rounded-t-3xl');
    });
  });
});
