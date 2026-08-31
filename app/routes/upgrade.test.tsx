import { screen } from '@testing-library/react';
import { href, RouterContextProvider } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { StartProCheckoutError } from '~/services/subscription';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';
import { action } from './upgrade';
import type { Route } from './+types/upgrade';
import type { User } from '~/repos/user';

const startProCheckoutMock = vi.fn();
vi.mock('~/services/subscription', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('~/services/subscription')>();
  return {
    ...actual,
    startProCheckout: (...args: unknown[]) => startProCheckoutMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function contextFor(user: User) {
  const context = new RouterContextProvider();
  context.set(userSessionContext, user);

  return context;
}

describe('page', () => {
  test('offers the upgrade to a user without a subscription', async () => {
    await renderRoute('/upgrade', {
      params: {},
      context: contextFor(userFixture),
    });

    expect(screen.getByRole('button', { name: 'Upgrade' }))
      .toBeInTheDocument();
  });

  test('offers the customer portal to a subscriber in a new tab',
    async () => {
      await renderRoute('/upgrade', {
        params: {},
        context: contextFor({
          ...userFixture,
          hasSubscription: true,
          creemCustomerId: 'cust_123',
        }),
      });

      const link = screen.getByRole('link', {
        name: 'Manage subscription',
      });
      expect(link).toHaveAttribute('href', href('/billing-portal'));
      expect(link).toHaveAttribute('target', '_blank');
      expect(screen.queryByRole('button', { name: 'Upgrade' }))
        .not.toBeInTheDocument();
    });

  test('shows no portal to a subscriber without a billing account',
    async () => {
      await renderRoute('/upgrade', {
        params: {},
        context: contextFor({ ...userFixture, hasSubscription: true }),
      });

      expect(screen.getByText('You already have all pro features. Enjoy!'))
        .toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Manage subscription' }))
        .not.toBeInTheDocument();
    });
});

describe('action', () => {
  function callAction(user: User) {
    const request = new Request('http://localhost:3000/upgrade', {
      method: 'POST',
      body: new FormData(),
    });

    return action({
      request,
      url: new URL(request.url),
      pattern: '/upgrade',
      params: {},
      context: contextFor(user),
    } as Route.ActionArgs);
  }

  test('sends the user to the Creem checkout', async () => {
    startProCheckoutMock.mockResolvedValue([
      null,
      { checkoutUrl: 'https://creem.invalid/checkout/ch_123' },
    ]);

    const response = await callAction(userFixture) as Response;

    expect(response.headers.get('Location'))
      .toBe('https://creem.invalid/checkout/ch_123');
    expect(startProCheckoutMock).toHaveBeenCalledWith(
      userFixture,
      'http://localhost:3000/upgrade/callback',
    );
  });

  test('starts no checkout for a subscriber', async () => {
    const response = await callAction(
      { ...userFixture, hasSubscription: true },
    ) as Response;

    expect(response.headers.get('Location')).toBe(href('/upgrade'));
    expect(startProCheckoutMock).not.toHaveBeenCalled();
  });

  test('sends the user back with a toast when the checkout fails',
    async () => {
      startProCheckoutMock
        .mockResolvedValue([StartProCheckoutError.CheckoutFailed]);

      const response = await callAction(userFixture) as Response;

      expect(response.headers.get('Location')).toContain('toastDanger');
    });
});
