import { RouterContextProvider } from 'react-router';
import './onboarding';
import { expect, test, vi } from 'vitest';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';
import { requiredUserSessionContext } from '~/contexts/user-session';

const redirectMock = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    redirect: (url: string, init?: number | ResponseInit) => {
      redirectMock(url);
      return actual.redirect(url, init);
    },
  };
});

test('redirects to home when user is already onboarded', async () => {
  const context = new RouterContextProvider();
  context.set(requiredUserSessionContext, { ...userFixture, onboarded: true });

  await renderRoute('/onboarding', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith('/home');
});

test('renders onboarding when user is not onboarded', async () => {
  const context = new RouterContextProvider();
  context.set(requiredUserSessionContext, { ...userFixture, onboarded: false });

  const { findByText } = await renderRoute('/onboarding', {
    params: {},
    context,
  });

  expect(await findByText(userFixture.email)).toBeInTheDocument();
});
