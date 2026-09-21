import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { expect, test, vi } from 'vitest';
import {
  SubscriptionUpgrade,
  SubscriptionUpgradeFooter,
} from './subscription-upgrade';

function renderUpgrade(documentCount = 2, action = vi.fn()) {
  const Stub = createRoutesStub([
    {
      path: '/settings/subscription',
      action,
      Component: () => (
        <AuthenticityTokenProvider token="test-token">
          <SubscriptionUpgrade documentCount={documentCount} />
          <SubscriptionUpgradeFooter />
        </AuthenticityTokenProvider>
      ),
    },
  ]);

  return render(<Stub initialEntries={['/settings/subscription']} />);
}

test('compares the free plan against pro', () => {
  const { container } = renderUpgrade(2);

  expect(screen.getByRole('heading', {
    name: 'You’ve used 2 of your 5 free docs.',
  })).toBeInTheDocument();
  for (const badge of screen.getAllByText('Current')) {
    expect(badge.closest('.bg-pca-white')).toBeInTheDocument();
  }
  expect(screen.getByText('Secure checkout by Creem.')).toBeInTheDocument();
  expect(screen.getByRole('rowheader', { name: 'Docs' })).toBeInTheDocument();
  expect(screen.getAllByTitle('Not included')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Upgrade to Pro' }))
    .toBeEnabled();
  expect(container).toMatchSnapshot();
});

test('tells a user at the limit that all docs are in use', () => {
  renderUpgrade(5);

  expect(screen.getByRole('heading', {
    name: 'You’ve used all 5 of your free docs.',
  })).toBeInTheDocument();
});

test('posts to the route to start the checkout', async () => {
  const action = vi.fn().mockResolvedValue(null);
  renderUpgrade(2, action);
  const person = userEvent.setup();

  await person.click(screen.getByRole('button', { name: 'Upgrade to Pro' }));

  await vi.waitFor(() => {
    expect(action).toHaveBeenCalledTimes(1);
  });
});
