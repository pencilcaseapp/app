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

const getDocumentListMock = vi.fn().mockResolvedValue([]);
const getSubscriptionOverviewMock = vi.fn();
const startProCheckoutMock = vi.fn();
const completeProCheckoutMock = vi.fn();

vi.mock('~/repos/document', () => ({
  getDocumentList: (...args: unknown[]) => getDocumentListMock(...args),
}));

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

const activeSubscription = {
  kind: 'subscribed',
  status: 'active',
  currentPeriodEnd: new Date('2026-07-06T00:00:00Z'),
} as SubscriptionOverview;

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
  getDocumentListMock.mockResolvedValue([]);
});

describe('page', () => {
  test('compares the free plan against pro for a free user', async () => {
    getDocumentListMock.mockResolvedValue([{}, {}]);

    await renderSubscription(userFixture, { kind: 'none' });

    expect(await screen.findByText('You’ve used 2 of your 3 free docs.'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' }))
      .toBeEnabled();
    expect(screen.getByText('Secure checkout by Creem.')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Docs' }))
      .toBeInTheDocument();
    for (const badge of screen.getAllByText('Current')) {
      expect(badge.closest('.bg-pca-white')).toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: 'Manage subscription' }))
      .not.toBeInTheDocument();
  });

  test('tells a free user at the limit that all docs are in use',
    async () => {
      getDocumentListMock.mockResolvedValue([{}, {}, {}]);

      await renderSubscription(userFixture, { kind: 'none' });

      expect(await screen.findByText('You’ve used all 3 of your free docs.'))
        .toBeInTheDocument();
    });

  test('shows the running subscription with the customer portal',
    async () => {
      await renderSubscription(subscriber, activeSubscription);

      expect(await screen.findByText('You’re on Pencil Case Pro.'))
        .toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByRole('rowheader', { name: 'Renews at' }))
        .toBeInTheDocument();
      expect(screen.getByText(/2026$/)).toBeInTheDocument();
      for (const badge of screen.getAllByText('Current')) {
        expect(badge.closest('.bg-pca-yellow-500')).toBeInTheDocument();
      }
      expect(screen.queryByRole('rowheader', { name: 'Docs' }))
        .not.toBeInTheDocument();

      const portal = screen.getByRole('link', {
        name: 'Manage subscription',
      });
      expect(portal).toHaveAttribute('href', href('/billing-portal'));
      expect(portal).toHaveAttribute('target', '_blank');
      expect(screen.queryByRole('button', { name: 'Upgrade to Pro' }))
        .not.toBeInTheDocument();
      expect(getDocumentListMock).not.toHaveBeenCalled();
    });

  test('shows a cancelled subscription until it runs out', async () => {
    await renderSubscription(subscriber, {
      ...activeSubscription,
      status: 'scheduled_cancel',
    } as SubscriptionOverview);

    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Active until' }))
      .toBeInTheDocument();
  });

  test('asks for a new payment method after a failed payment', async () => {
    await renderSubscription(subscriber, {
      ...activeSubscription,
      status: 'past_due',
    } as SubscriptionOverview);

    expect(await screen.findByText('Payment failed')).toBeInTheDocument();
    expect(screen.getByText(/^Update your payment method/))
      .toBeInTheDocument();
  });

  test('shows complimentary pro to an invited friend', async () => {
    await renderSubscription(
      { ...userFixture, hasSubscription: true },
      { kind: 'complimentary' },
    );

    expect(await screen.findByText('On the house. Enjoy!'))
      .toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage subscription' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upgrade to Pro' }))
      .not.toBeInTheDocument();
  });
});

describe('loader', () => {
  function callLoader(
    searchParams: Record<string, string>,
    user = userFixture,
  ) {
    const search = new URLSearchParams(searchParams).toString();
    const request = new Request(
      `http://localhost:3000${subscriptionUrl}?${search}`,
    );

    return loader({
      request,
      url: new URL(request.url),
      pattern: '/doc/:id/settings/subscription',
      params: { id: DOC_ID },
      context: contextFor(user),
    } as Route.LoaderArgs);
  }

  test('counts the docs of a free user', async () => {
    getSubscriptionOverviewMock.mockResolvedValue({ kind: 'none' });
    getDocumentListMock.mockResolvedValue([{}, {}]);

    const data = await callLoader({});

    expect(data).toMatchObject({
      overview: { kind: 'none' },
      documentCount: 2,
    });
    expect(getDocumentListMock).toHaveBeenCalledWith(userFixture.id);
  });

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
