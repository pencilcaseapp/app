// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { DeleteAccountError } from '~/services/account';
import { userFixture } from '~/test/fixtures/user';
import { action } from './account-delete';
import type { Route } from './+types/account-delete';

const deleteAccountMock = vi.fn();
vi.mock('~/services/account', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/account')>();
  return {
    ...actual,
    deleteAccount: (...args: unknown[]) => deleteAccountMock(...args),
  };
});

const signOutMock = vi.fn();
vi.mock('~/services/auth', () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  signOutMock.mockResolvedValue('session=; Max-Age=0');
});

function callAction() {
  const formData = new FormData();
  formData.set('csrf', 'test-token');
  formData.set('returnTo', '/doc/1/settings/account');
  const request = new Request('http://localhost/account/delete', {
    method: 'POST',
    body: formData,
  });
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/account/delete',
    params: {},
    context,
  } as Route.ActionArgs);
}

test('deletes the account and signs out to the sign in page', async () => {
  deleteAccountMock.mockResolvedValue([null, {
    restoreUntil: new Date('2026-12-23T16:00:00.000Z'),
  }]);

  const response = await callAction() as Response;

  expect(deleteAccountMock).toHaveBeenCalledWith(userFixture);
  expect(response.status).toBe(302);
  expect(response.headers.get('Location'))
    .toBe('/signin?restoreUntil=2026-12-23');
  expect(response.headers.get('Set-Cookie')).toBe('session=; Max-Age=0');
});

test('keeps the user signed in when the deletion failed', async () => {
  deleteAccountMock.mockResolvedValue([
    DeleteAccountError.CancelSubscriptionFailed,
  ]);

  const response = await callAction() as Response;

  expect(response.headers.get('Location')).toBe(
    '/doc/1/settings/account?toastDanger='
    + 'Your+account+could+not+be+deleted.+Please+try+again.',
  );
  expect(response.headers.get('Set-Cookie')).toBeNull();
  expect(signOutMock).not.toHaveBeenCalled();
});
