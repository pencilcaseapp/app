import { RouterContextProvider } from 'react-router';
import './onboarding';
import { beforeEach, expect, test, vi } from 'vitest';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';
import { userSessionContext } from '~/contexts/user-session';
import userEvent from '@testing-library/user-event';
import { act, fireEvent } from '@testing-library/react';

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

const onboardUserMock = vi.fn();
vi.mock('~/services/auth', async () => ({
  onboardUser: (...args: unknown[]) => onboardUserMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('redirects to home when user is already onboarded', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, { ...userFixture, onboarded: true });

  await renderRoute('/onboarding', {
    params: {},
    context,
  });

  expect(redirectMock).toHaveBeenCalledWith('/home');
});

test('renders onboarding when user is not onboarded', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, { ...userFixture, onboarded: false });

  const { findByText } = await renderRoute('/onboarding', {
    params: {},
    context,
  });

  expect(await findByText('Congrats. Welcome!')).toBeInTheDocument();
});

test('redirects after form submission', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, { ...userFixture, onboarded: false });

  const { findByLabelText, findByText } = await renderRoute('/onboarding', {
    params: {},
    context,
  });

  const inputName = await findByLabelText('Name');
  const button = await findByText('Continue');

  await userEvent.type(inputName, 'John Doe');
  await act(async () => fireEvent.submit(button));

  await vi.waitFor(() => {
    expect(redirectMock).toHaveBeenCalledWith('/home');
  });
});

test('persists user preferences', async () => {
  const context = new RouterContextProvider();
  context.set(userSessionContext, { ...userFixture, onboarded: false });

  const { findByLabelText, findByText, findByRole } = await renderRoute('/onboarding', {
    params: {},
    context,
  });

  const inputName = await findByLabelText('Name');
  const inputNewsletter = await findByRole('checkbox');
  const button = await findByText('Continue');

  await userEvent.type(inputName, 'John Doe');
  await userEvent.click(inputNewsletter);
  await act(async () => fireEvent.submit(button));

  await vi.waitFor(() => {
    expect(onboardUserMock).toHaveBeenCalledWith(userFixture.id, {
      name: 'John Doe',
      newsletter: true,
    });
  });
});
