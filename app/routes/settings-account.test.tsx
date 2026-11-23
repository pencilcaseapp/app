import { screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RouterContextProvider } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  optionalUserSessionContext,
  userSessionContext,
} from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';

const updateUserMock = vi.fn();

vi.mock('~/repos/user', () => ({
  updateUser: (...args: unknown[]) => updateUserMock(...args),
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

async function renderAccount({ isMobile = false } = {}) {
  useMediaMock.mockImplementation(
    (query: string) => isMobile && query === MOBILE_QUERY,
  );

  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, user);
  context.set(userSessionContext, user);

  await renderRoute('/doc/:id/settings/account', {
    params: { id: DOC_ID },
    context,
    parentRoute: '/doc/:id/settings',
  });

  return userEvent.setup();
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('the settings account route', () => {
  test('prefill the form with the account of the session', async () => {
    await renderAccount();

    expect(await screen.findByLabelText('Name')).toHaveValue('Ada Lovelace');
    expect(screen.getByLabelText('Subscribe to Newsletter'))
      .not.toBeChecked();
    expect(
      screen.getByRole('link', { name: user.email }),
    ).toHaveAttribute('href', `/doc/${DOC_ID}/settings/account/email`);
  });

  test('save the name and the newsletter preference', async () => {
    const person = await renderAccount();

    const name = await screen.findByLabelText('Name');
    await person.clear(name);
    await person.type(name, 'Grace Hopper');
    await person.click(screen.getByLabelText('Subscribe to Newsletter'));
    await person.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith(user.id, {
        name: 'Grace Hopper',
        newsletter: true,
      });
    });
  });

  test('keep the untouched values on save', async () => {
    const person = await renderAccount();

    await person.click(await screen.findByRole('button', { name: 'Save' }));

    await vi.waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith(user.id, {
        name: 'Ada Lovelace',
        newsletter: false,
      });
    });
  });

  test('save from the footer of the drawer variant', async () => {
    const person = await renderAccount({ isMobile: true });

    await person.click(await screen.findByRole('button', { name: 'Save' }));

    await vi.waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledTimes(1);
    });
  });

  test('emit a toast once the account was updated', async () => {
    const person = await renderAccount();

    await person.click(await screen.findByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Your account has been updated'),
    ).toBeInTheDocument();
  });

  test('offer to delete the account in the danger zone', async () => {
    await renderAccount();

    const dangerZone = await screen.findByRole('region', {
      name: 'Danger zone',
    });
    expect(dangerZone).toHaveTextContent(
      'Delete your account and every document in it. '
      + 'Sign in within 30 days to get it back.',
    );
  });

  test('ask before deleting the account', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-23T16:00Z') });
    const person = await renderAccount();

    await person.click(
      await screen.findByRole('button', { name: 'Delete account' }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Delete your account?',
    });
    expect(dialog).toHaveTextContent(
      'Changed your mind? Sign in again by 23 December 2026 to restore everything.',
    );
    expect(
      within(dialog).getByRole('button', { name: 'Delete account' }),
    ).toHaveAttribute('type', 'submit');
    expect(dialog.querySelector('form'))
      .toHaveAttribute('action', '/account/delete');
    vi.useRealTimers();
  });
});
