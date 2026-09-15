import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { SubscriptionStatus } from '~/constants/subscription';
import { CurrentSubscription } from './current-subscription';

describe('CurrentSubscription', () => {
  test('shows an active subscription with its renewal date', () => {
    const { container } = render(
      <CurrentSubscription
        status={SubscriptionStatus.Active}
        periodEnd="06.07.2026"
        hasBillingAccount
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('25 €')).toBeInTheDocument();
    expect(screen.getByText('Renews at: 06.07.2026')).toBeInTheDocument();

    const portal = screen.getByRole('link', { name: 'Manage Subscription' });
    expect(portal).toHaveAttribute('href', '/billing-portal');
    expect(portal).toHaveAttribute('target', '_blank');
    expect(container).toMatchSnapshot();
  });

  test('shows a cancelled subscription running out', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.ScheduledCancel}
        periodEnd="06.07.2026"
        hasBillingAccount
      />,
    );

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Active until: 06.07.2026')).toBeInTheDocument();
  });

  test('asks for a new payment method after a failed payment', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.PastDue}
        periodEnd="06.07.2026"
        hasBillingAccount
      />,
    );

    expect(screen.getByText('Payment failed')).toBeInTheDocument();
    expect(screen.getByText(/Update your payment method/))
      .toBeInTheDocument();
  });

  test('leaves the date out when the period end is unknown', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.Active}
        periodEnd={null}
        hasBillingAccount
      />,
    );

    expect(screen.queryByText(/Renews at/)).not.toBeInTheDocument();
  });

  test('shows complimentary pro without a price or a portal', () => {
    render(
      <CurrentSubscription
        status="complimentary"
        periodEnd={null}
        hasBillingAccount={false}
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('On the house. Enjoy!')).toBeInTheDocument();
    expect(screen.queryByText('25 €')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage Subscription' }))
      .not.toBeInTheDocument();
  });
});
