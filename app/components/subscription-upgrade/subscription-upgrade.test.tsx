import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { expect, test, vi } from 'vitest';
import { SubscriptionUpgrade } from './subscription-upgrade';

function renderUpgrade(action = vi.fn()) {
  const Stub = createRoutesStub([
    {
      path: '/settings/subscription',
      action,
      Component: () => (
        <AuthenticityTokenProvider token="test-token">
          <SubscriptionUpgrade />
        </AuthenticityTokenProvider>
      ),
    },
  ]);

  return render(<Stub initialEntries={['/settings/subscription']} />);
}

test('presents the pro plan', () => {
  const { container } = renderUpgrade();

  expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
  expect(screen.getByText('25 €')).toBeInTheDocument();
  expect(container).toMatchSnapshot();
});

test('posts to the route to start the checkout', async () => {
  const action = vi.fn().mockResolvedValue(null);
  renderUpgrade(action);
  const person = userEvent.setup();

  await person.click(screen.getByRole('button', { name: 'Upgrade to Pro' }));

  await vi.waitFor(() => {
    expect(action).toHaveBeenCalledTimes(1);
  });
});
