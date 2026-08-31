import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  createRoutesStub,
  RouterContextProvider,
  type LoaderFunction,
} from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  optionalUserSessionContext,
  userSessionContext,
} from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';
import { ToastProvider } from '~/ui/toast/toast-provider';
import Settings, { loader as settingsLoader } from './settings';
import SettingsAccountRoute, {
  action as settingsAccountAction,
} from './settings-account';

const updateAccountMock = vi.fn();

vi.mock('~/services/auth', () => ({
  updateAccount: (...args: unknown[]) => updateAccountMock(...args),
  getAuthSession: vi.fn(),
  getSignInUrl: vi.fn(),
}));

const MOBILE_QUERY = '(width < 40rem)';

const useMediaMock = vi.fn().mockReturnValue(false);

vi.mock('react-use', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('react-use')>(),
    useMedia: (query: string) => useMediaMock(query),
  };
});

const DOC_ID = '11111111-2222-4333-8444-555555555555';

const user = {
  ...userFixture,
  name: 'Ada Lovelace',
  newsletter: false,
};

function renderAccount({ isMobile = false } = {}) {
  useMediaMock.mockImplementation(
    (query: string) => isMobile && query === MOBILE_QUERY,
  );

  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, user);
  context.set(userSessionContext, user);

  const Stub = createRoutesStub([
    {
      path: '/doc/:id/settings',
      Component: Settings as React.ComponentType,
      loader: settingsLoader as unknown as LoaderFunction,
      children: [
        {
          path: 'account',
          Component: SettingsAccountRoute,
          action: settingsAccountAction as unknown as LoaderFunction,
        },
      ],
    },
  ], context);

  render(
    <ToastProvider>
      <AuthenticityTokenProvider token="test-token">
        <Stub initialEntries={[`/doc/${DOC_ID}/settings/account`]} />
      </AuthenticityTokenProvider>
    </ToastProvider>,
  );

  return userEvent.setup();
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('the settings account route', () => {
  test('prefill the form with the account of the session', async () => {
    renderAccount();

    expect(await screen.findByLabelText('Name')).toHaveValue('Ada Lovelace');
    expect(screen.getByLabelText('Subscribe to Newsletter'))
      .not.toBeChecked();
    expect(
      screen.getByRole('button', { name: user.email }),
    ).toBeInTheDocument();
  });

  test('save the name and the newsletter preference', async () => {
    const person = renderAccount();

    const name = await screen.findByLabelText('Name');
    await person.clear(name);
    await person.type(name, 'Grace Hopper');
    await person.click(screen.getByLabelText('Subscribe to Newsletter'));
    await person.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => {
      expect(updateAccountMock).toHaveBeenCalledWith(user.id, {
        name: 'Grace Hopper',
        newsletter: true,
      });
    });
  });

  test('keep the untouched values on save', async () => {
    const person = renderAccount();

    await person.click(await screen.findByRole('button', { name: 'Save' }));

    await vi.waitFor(() => {
      expect(updateAccountMock).toHaveBeenCalledWith(user.id, {
        name: 'Ada Lovelace',
        newsletter: false,
      });
    });
  });

  test('save from the footer of the drawer variant', async () => {
    const person = renderAccount({ isMobile: true });

    await person.click(await screen.findByRole('button', { name: 'Save' }));

    await vi.waitFor(() => {
      expect(updateAccountMock).toHaveBeenCalledTimes(1);
    });
  });

  test('emit a toast once the account was updated', async () => {
    const person = renderAccount();

    await person.click(await screen.findByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Your account has been updated.'),
    ).toBeInTheDocument();
  });
});
