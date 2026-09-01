import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { expect, test, vi } from 'vitest';
import { PRO_PLAN } from '~/constants/subscription';
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

test('presents the pro plan with its features', () => {
  const { container } = renderUpgrade();

  expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
  expect(screen.getByText('25 €')).toBeInTheDocument();
  for (const feature of PRO_PLAN.features) {
    expect(screen.getByText(feature)).toBeInTheDocument();
  }
  expect(screen.getByRole('presentation'))
    .toHaveAttribute('src', '/upgrade-pencil@2x.png');
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
