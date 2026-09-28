// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { StartProCheckoutError } from '~/services/subscription';
import { userFixture } from '~/test/fixtures/user';
import { loader } from './doc-checkout';
import type { Route } from './+types/doc-checkout';

const getSubscriptionOverviewMock = vi.fn();
const startProCheckoutMock = vi.fn();
vi.mock('~/services/subscription', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('~/services/subscription')>();
  return {
    ...actual,
    getSubscriptionOverview:
      (...args: unknown[]) => getSubscriptionOverviewMock(...args),
    startProCheckout: (...args: unknown[]) => startProCheckoutMock(...args),
  };
});

const DOC_ID = '11111111-2222-4333-8444-555555555555';
const subscriptionUrl = `/doc/${DOC_ID}/settings/subscription`;

beforeEach(() => {
  vi.clearAllMocks();
});

function callLoader() {
  const request = new Request(`http://localhost:3000/doc/${DOC_ID}/checkout`);
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return loader({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/checkout',
    params: { id: DOC_ID },
    context,
  } as Route.LoaderArgs);
}

test('sends the user to the Creem checkout and back to the settings',
  async () => {
    getSubscriptionOverviewMock.mockResolvedValue({ kind: 'none' });
    startProCheckoutMock.mockResolvedValue([
      null,
      { checkoutUrl: 'https://creem.invalid/checkout/ch_123' },
    ]);

    const response = await callLoader();

    expect(response.headers.get('Location'))
      .toBe('https://creem.invalid/checkout/ch_123');
    expect(startProCheckoutMock).toHaveBeenCalledWith(
      userFixture,
      `http://localhost:3000${subscriptionUrl}`,
    );
  });

test('starts no checkout for a user with the pro features', async () => {
  getSubscriptionOverviewMock.mockResolvedValue({ kind: 'complimentary' });

  const response = await callLoader();

  expect(response.headers.get('Location')).toBe(subscriptionUrl);
  expect(startProCheckoutMock).not.toHaveBeenCalled();
});

test('sends the user back with a toast when the checkout fails',
  async () => {
    getSubscriptionOverviewMock.mockResolvedValue({ kind: 'none' });
    startProCheckoutMock
      .mockResolvedValue([StartProCheckoutError.CheckoutFailed]);

    const response = await callLoader();

    expect(response.headers.get('Location'))
      .toContain(`${subscriptionUrl}?toastDanger`);
  });
