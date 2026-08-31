import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { describe, expect, test } from 'vitest';
import { PRO_FEATURES, UpgradeTeaser } from './upgrade-teaser';

function renderUpgradeTeaser() {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: () => (
        <AuthenticityTokenProvider token="test-token">
          <UpgradeTeaser
            headline="Your pencil case is full"
            description="Free fits three docs."
          />
        </AuthenticityTokenProvider>
      ),
    },
    {
      path: '/upgrade',
      action: async () => ({ ok: true }),
    },
  ]);

  return render(<Stub initialEntries={['/']} />);
}

describe('UpgradeTeaser', () => {
  test('renders headline, description and pricing table', () => {
    const { container } = renderUpgradeTeaser();

    expect(
      screen.getByText('Your pencil case is full'),
    ).toBeInTheDocument();
    expect(screen.getByText('Free fits three docs.')).toBeInTheDocument();
    expect(screen.getByText('25 €')).toBeInTheDocument();

    for (const feature of PRO_FEATURES) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }

    expect(container).toMatchSnapshot();
  });

  test('submits the upgrade form to the checkout action', () => {
    renderUpgradeTeaser();

    const button = screen.getByRole('button', { name: 'Upgrade to Pro' });
    const form = button.closest('form');

    expect(form).toHaveAttribute('action', '/upgrade');
    expect(form).toHaveAttribute('method', 'post');
  });
});
