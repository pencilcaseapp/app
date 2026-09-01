import { screen } from '@testing-library/react';
import { href, RouterContextProvider } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  optionalUserSessionContext,
  userSessionContext,
} from '~/contexts/user-session';
import type { User } from '~/repos/user';
import {
  CompleteProCheckoutError,
  StartProCheckoutError,
  type SubscriptionOverview,
} from '~/services/subscription';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';
import { action, loader } from './settings-subscription';
import type { Route } from './+types/settings-subscription';

const getSubscriptionOverviewMock = vi.fn();
const startProCheckoutMock = vi.fn();
const completeProCheckoutMock = vi.fn();
vi.mock('~/services/subscription', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('~/services/subscription')>();
  return {
    ...actual,
    getSubscriptionOverview:
      (...args: unknown[]) => getSubscriptionOverviewMock(...args),
    startProCheckout: (...args: unknown[]) => startProCheckoutMock(...args),
    completeProCheckout:
      (...args: unknown[]) => completeProCheckoutMock(...args),
  };
});

const DOC_ID = '11111111-2222-4333-8444-555555555555';
const subscriptionUrl = `/doc/${DOC_ID}/settings/subscription`;

const subscriber: User = {
  ...userFixture,
  hasSubscription: true,
  creemCustomerId: 'cust_123',
};

function contextFor(user: User) {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, user);
  context.set(userSessionContext, user);

  return context;
}

async function renderSubscription(
  user: User,
  overview: SubscriptionOverview,
) {
  getSubscriptionOverviewMock.mockResolvedValue(overview);

  await renderRoute('/doc/:id/settings/subscription', {
    params: { id: DOC_ID },
    context: contextFor(user),
    parentRoute: '/doc/:id/settings',
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('page', () => {
  test('offers the upgrade to a user without the pro features',
    async () => {
      await renderSubscription(userFixture, { kind: 'none' });

      expect(
        await screen.findByRole('button', { name: 'Upgrade to Pro' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Hosted in the EU')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Manage Subscription' }))
        .not.toBeInTheDocument();
    });

  test('shows the running subscription with the customer portal',
    async () => {
      await renderSubscription(subscriber, {
        kind: 'subscribed',
        status: 'active',
        currentPeriodEnd: new Date('2026-07-06T00:00:00Z'),
      } as SubscriptionOverview);

      expect(await screen.findByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Renews at: 06.07.2026')).toBeInTheDocument();

      const portal = screen.getByRole('link', {
        name: 'Manage Subscription',
      });
      expect(portal).toHaveAttribute('href', href('/billing-portal'));
      expect(portal).toHaveAttribute('target', '_blank');
      expect(screen.queryByRole('button', { name: 'Upgrade to Pro' }))
        .not.toBeInTheDocument();
    });

  test('shows a cancelled subscription until it runs out', async () => {
    await renderSubscription(subscriber, {
      kind: 'subscribed',
      status: 'scheduled_cancel',
      currentPeriodEnd: new Date('2026-07-06T00:00:00Z'),
    } as SubscriptionOverview);

    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Active until: 06.07.2026')).toBeInTheDocument();
  });

  test('shows complimentary pro to an invited friend', async () => {
    await renderSubscription(
      { ...userFixture, hasSubscription: true },
      { kind: 'complimentary' },
    );

    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('On the house. Enjoy!')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage Subscription' }))
      .not.toBeInTheDocument();
  });
});

describe('loader', () => {
  function callLoader(searchParams: Record<string, string>) {
    const search = new URLSearchParams(searchParams).toString();
    const request = new Request(
      `http://localhost:3000${subscriptionUrl}?${search}`,
    );

    return loader({
      request,
      url: new URL(request.url),
      pattern: '/doc/:id/settings/subscription',
      params: { id: DOC_ID },
      context: contextFor(userFixture),
    } as Route.LoaderArgs);
  }

  test('confirms the checkout Creem sends the user back from',
    async () => {
      completeProCheckoutMock.mockResolvedValue([null]);

      const response = await callLoader({
        checkout_id: 'ch_123',
        subscription_id: 'sub_123',
        signature: 'sig',
      }) as Response;

      const location = response.headers.get('Location') ?? '';
      expect(location).toContain(`${subscriptionUrl}?toastSuccess`);
      expect(location).not.toContain('checkout_id');

      const searchParams
        = completeProCheckoutMock.mock.calls[0][0] as URLSearchParams;
      expect(searchParams.get('subscription_id')).toBe('sub_123');
      expect(getSubscriptionOverviewMock).not.toHaveBeenCalled();
    });

  test('reports a checkout it cannot confirm', async () => {
    completeProCheckoutMock
      .mockResolvedValue([CompleteProCheckoutError.InvalidSignature]);

    const response = await callLoader({ checkout_id: 'ch_123' }) as Response;

    expect(response.headers.get('Location'))
      .toContain(`${subscriptionUrl}?toastDanger`);
  });
});

describe('action', () => {
  function callAction(user: User) {
    const request = new Request(`http://localhost:3000${subscriptionUrl}`, {
      method: 'POST',
      body: new FormData(),
    });

    return action({
      request,
      url: new URL(request.url),
      pattern: '/doc/:id/settings/subscription',
      params: { id: DOC_ID },
      context: contextFor(user),
    } as Route.ActionArgs);
  }

  test('sends the user to the Creem checkout and back here', async () => {
    getSubscriptionOverviewMock.mockResolvedValue({ kind: 'none' });
    startProCheckoutMock.mockResolvedValue([
      null,
      { checkoutUrl: 'https://creem.invalid/checkout/ch_123' },
    ]);

    const response = await callAction(userFixture) as Response;

    expect(response.headers.get('Location'))
      .toBe('https://creem.invalid/checkout/ch_123');
    expect(startProCheckoutMock).toHaveBeenCalledWith(
      userFixture,
      `http://localhost:3000${subscriptionUrl}`,
    );
  });

  test('starts no checkout for a user with the pro features', async () => {
    getSubscriptionOverviewMock.mockResolvedValue({ kind: 'complimentary' });

    const response = await callAction(subscriber) as Response;

    expect(response.headers.get('Location')).toBe(subscriptionUrl);
    expect(startProCheckoutMock).not.toHaveBeenCalled();
  });

  test('sends the user back with a toast when the checkout fails',
    async () => {
      getSubscriptionOverviewMock.mockResolvedValue({ kind: 'none' });
      startProCheckoutMock
        .mockResolvedValue([StartProCheckoutError.CheckoutFailed]);

      const response = await callAction(userFixture) as Response;

      expect(response.headers.get('Location'))
        .toContain(`${subscriptionUrl}?toastDanger`);
    });
});
