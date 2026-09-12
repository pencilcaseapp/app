import { screen } from '@testing-library/react';
import { href, RouterContextProvider } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  optionalUserSessionContext,
  userSessionContext,
} from '~/contexts/user-session';
import { StartProCheckoutError } from '~/services/subscription';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';
import { action } from './settings-subscription';
import type { Route } from './+types/settings-subscription';
import type { User } from '~/repos/user';

const getDocumentListMock = vi.fn().mockResolvedValue([]);
const startProCheckoutMock = vi.fn();

vi.mock('~/repos/document', () => ({
  getDocumentList: (...args: unknown[]) => getDocumentListMock(...args),
}));

vi.mock('~/services/subscription', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('~/services/subscription')>();
  return {
    ...actual,
    startProCheckout: (...args: unknown[]) => startProCheckoutMock(...args),
  };
});

vi.mock('react-use', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('react-use')>(),
    useMedia: () => false,
  };
});

const DOC_ID = '11111111-2222-4333-8444-555555555555';

function contextFor(user: User) {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, user);
  context.set(userSessionContext, user);

  return context;
}

function renderSubscription(user: User) {
  return renderRoute('/doc/:id/settings/subscription', {
    params: { id: DOC_ID },
    context: contextFor(user),
    parentRoute: '/doc/:id/settings',
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('the settings subscription route', () => {
  test('compares the free plan against pro for a free user', async () => {
    getDocumentListMock.mockResolvedValue([{}, {}]);

    await renderSubscription(userFixture);

    expect(await screen.findByText('You’ve used 2 of your 3 free docs.'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' }))
      .toBeEnabled();
    expect(screen.getByRole('rowheader', { name: 'Docs' }))
      .toBeInTheDocument();
    expect(screen.getAllByTitle('Not included')).toHaveLength(2);
    // The badge renders once per breakpoint slot, both inside the free
    // card: the pro card carries none.
    const badges = screen.getAllByText('Current');
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(badge.closest('.bg-pca-white')).toBeInTheDocument();
    }
  });

  test('tells a free user at the limit that all docs are in use',
    async () => {
      getDocumentListMock.mockResolvedValue([{}, {}, {}]);

      await renderSubscription(userFixture);

      expect(await screen.findByText('You’ve used all 3 of your free docs.'))
        .toBeInTheDocument();
    });

  test('offers the customer portal to a subscriber', async () => {
    await renderSubscription({
      ...userFixture,
      hasSubscription: true,
      creemCustomerId: 'cust_123',
    });

    const link = await screen.findByRole('link', {
      name: 'Manage subscription',
    });
    expect(screen.getByText('You’re on Pencil Case Pro.'))
      .toBeInTheDocument();
    for (const badge of screen.getAllByText('Current')) {
      expect(badge.closest('.bg-pca-yellow-500')).toBeInTheDocument();
    }
    expect(link).toHaveAttribute('href', href('/billing-portal'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.queryByRole('button', { name: 'Upgrade to Pro' }))
      .not.toBeInTheDocument();
    expect(getDocumentListMock).not.toHaveBeenCalled();
  });

  test('shows no portal to a subscriber without a billing account',
    async () => {
      await renderSubscription({ ...userFixture, hasSubscription: true });

      expect(
        await screen.findByText('You already have all pro features. Enjoy!'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Manage subscription' }))
        .not.toBeInTheDocument();
    });
});

describe('action', () => {
  const subscriptionUrl = href('/doc/:id/settings/subscription', {
    id: DOC_ID,
  });

  function callAction(user: User) {
    const request = new Request(
      `http://localhost:3000${subscriptionUrl}`,
      { method: 'POST', body: new FormData() },
    );

    return action({
      request,
      url: new URL(request.url),
      pattern: '/doc/:id/settings/subscription',
      params: { id: DOC_ID },
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

    expect(response.headers.get('Location')).toBe(subscriptionUrl);
    expect(startProCheckoutMock).not.toHaveBeenCalled();
  });

  test('keeps the user in the dialog with a toast when the checkout fails',
    async () => {
      startProCheckoutMock
        .mockResolvedValue([StartProCheckoutError.CheckoutFailed]);

      const response = await callAction(userFixture) as Response;

      const location = response.headers.get('Location') ?? '';
      expect(location).toContain(subscriptionUrl);
      expect(location).toContain('toastDanger');
    });
});
