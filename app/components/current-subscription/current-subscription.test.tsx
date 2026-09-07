import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { SubscriptionStatus } from '~/constants/subscription';
import {
  CurrentSubscription,
  CurrentSubscriptionFooter,
} from './current-subscription';

describe('CurrentSubscription', () => {
  test('shows an active subscription with its renewal date', () => {
    const { container } = render(
      <>
        <CurrentSubscription
          status={SubscriptionStatus.Active}
          periodEnd="06.07.2026"
        />
        <CurrentSubscriptionFooter hasBillingAccount />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'You’re on Pencil Case Pro.' }))
      .toBeInTheDocument();
    expect(screen.getByText('Renews at: 06.07.2026')).toBeInTheDocument();
    for (const badge of screen.getAllByText('Current')) {
      expect(badge.closest('.bg-pca-yellow-500')).toBeInTheDocument();
    }

    const portal = screen.getByRole('link', { name: 'Manage subscription' });
    expect(portal).toHaveAttribute('href', '/billing-portal');
    expect(portal).toHaveAttribute('target', '_blank');
    expect(screen.getByText('Billing lives in the Creem portal.'))
      .toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('shows a cancelled subscription running out', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.ScheduledCancel}
        periodEnd="06.07.2026"
      />,
    );

    expect(screen.getByText('Cancelled. Active until: 06.07.2026'))
      .toBeInTheDocument();
  });

  test('asks for a new payment method after a failed payment', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.PastDue}
        periodEnd="06.07.2026"
      />,
    );

    expect(screen.getByText(/^Payment failed\. Update your payment method/))
      .toBeInTheDocument();
  });

  test('leaves the date out when the period end is unknown', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.Active}
        periodEnd={null}
      />,
    );

    expect(screen.queryByText(/Renews at/)).not.toBeInTheDocument();
  });

  test('shows complimentary pro without a portal', () => {
    render(
      <>
        <CurrentSubscription status="complimentary" periodEnd={null} />
        <CurrentSubscriptionFooter hasBillingAccount={false} />
      </>,
    );

    expect(screen.getByText('On the house. Enjoy!')).toBeInTheDocument();
    expect(screen.getByText('You already have all pro features.'))
      .toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage subscription' }))
      .not.toBeInTheDocument();
  });
});
