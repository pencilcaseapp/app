import { screen } from '@testing-library/react';
import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { CompleteProCheckoutError } from '~/services/subscription';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';

const completeProCheckoutMock = vi.fn();
vi.mock('~/services/subscription', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('~/services/subscription')>();
  return {
    ...actual,
    completeProCheckout:
      (...args: unknown[]) => completeProCheckoutMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function renderCallback() {
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return renderRoute('/upgrade/callback', {
    params: {},
    context,
    searchParams: {
      checkout_id: 'ch_123',
      subscription_id: 'sub_123',
      signature: 'sig',
    },
  });
}

test('confirms the upgrade when the checkout went through', async () => {
  completeProCheckoutMock.mockResolvedValue([null]);

  await renderCallback();

  expect(screen.getByText('You are all set!')).toBeInTheDocument();

  const searchParams
    = completeProCheckoutMock.mock.calls[0][0] as URLSearchParams;
  expect(searchParams.get('subscription_id')).toBe('sub_123');
});

test('shows the failure state when the redirect does not check out',
  async () => {
    completeProCheckoutMock
      .mockResolvedValue([CompleteProCheckoutError.InvalidSignature]);

    await renderCallback();

    expect(screen.getByText('We could not confirm this payment.'))
      .toBeInTheDocument();
    expect(screen.queryByText('You are all set!')).not.toBeInTheDocument();
  });
