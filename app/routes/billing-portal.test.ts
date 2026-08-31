// @vitest-environment node

import { href, RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { GetBillingPortalUrlError } from '~/services/subscription';
import { userFixture } from '~/test/fixtures/user';
import { loader } from './billing-portal';
import type { Route } from './+types/billing-portal';

const getBillingPortalUrlMock = vi.fn();
vi.mock('~/services/subscription', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('~/services/subscription')>();
  return {
    ...actual,
    getBillingPortalUrl:
      (...args: unknown[]) => getBillingPortalUrlMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function callLoader() {
  const request = new Request('http://localhost/billing-portal');
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return loader({
    request,
    url: new URL(request.url),
    pattern: '/billing-portal',
    params: {},
    context,
  } as Route.LoaderArgs);
}

test('redirects to the customer portal', async () => {
  getBillingPortalUrlMock.mockResolvedValue([
    null,
    { portalUrl: 'https://creem.invalid/my-orders/login/abc' },
  ]);

  const response = await callLoader();

  expect(response.headers.get('Location'))
    .toBe('https://creem.invalid/my-orders/login/abc');
  expect(getBillingPortalUrlMock).toHaveBeenCalledWith(userFixture);
});

test('sends a user without a billing account back with a toast',
  async () => {
    getBillingPortalUrlMock
      .mockResolvedValue([GetBillingPortalUrlError.NoCreemCustomer]);

    const response = await callLoader();

    const location = response.headers.get('Location') ?? '';
    expect(location).toContain(href('/upgrade'));
    expect(location).toContain('toastDanger');
  });

test('sends a user back with a toast when the portal fails', async () => {
  getBillingPortalUrlMock
    .mockResolvedValue([GetBillingPortalUrlError.PortalFailed]);

  const response = await callLoader();

  expect(response.headers.get('Location')).toContain('toastDanger');
});
