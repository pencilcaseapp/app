import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { SubscriptionStatus } from '~/constants/subscription';
import {
  CurrentSubscription,
  CurrentSubscriptionFooter,
} from './current-subscription';

const rowOf = (label: string) => within(
  screen.getByRole('rowheader', { name: label }).closest('tr')!,
);

describe('CurrentSubscription', () => {
  test('shows an active subscription with its renewal date', () => {
    const { container } = render(
      <>
        <CurrentSubscription
          status={SubscriptionStatus.Active}
          periodEnd="06.07.2026"
        />
        <CurrentSubscriptionFooter />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'You’re on Pencil Case Pro.' }))
      .toBeInTheDocument();
    expect(rowOf('Status').getByText('Active')).toBeInTheDocument();
    expect(rowOf('Renews at').getByText('06.07.2026')).toBeInTheDocument();
    for (const badge of screen.getAllByText('Current')) {
      expect(badge.closest('.bg-pca-yellow-500')).toBeInTheDocument();
    }
    // Nothing left to compare once on pro.
    expect(screen.queryByRole('rowheader', { name: 'Docs' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    const portal = screen.getByRole('link', { name: 'Manage subscription' });
    expect(portal).toHaveAttribute('href', '/billing-portal');
    expect(portal).toHaveAttribute('target', '_blank');
    expect(container).toMatchSnapshot();
  });

  test('shows a trial with the day it ends', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.Trialing}
        periodEnd="06.07.2026"
      />,
    );

    expect(rowOf('Status').getByText('Trial')).toBeInTheDocument();
    expect(rowOf('Trial ends at').getByText('06.07.2026'))
      .toBeInTheDocument();
  });

  test('shows a cancelled subscription running out', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.ScheduledCancel}
        periodEnd="06.07.2026"
      />,
    );

    expect(rowOf('Status').getByText('Cancelled')).toBeInTheDocument();
    expect(rowOf('Active until').getByText('06.07.2026'))
      .toBeInTheDocument();
  });

  test('raises a failed payment above the status', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.PastDue}
        periodEnd="06.07.2026"
      />,
    );

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent(
      'Update your payment method in the customer portal to keep Pro.',
    );
    expect(notice).toHaveClass('bg-pca-red-300');
    expect(rowOf('Status').getByText('Payment failed')).toBeInTheDocument();
    expect(
      notice.compareDocumentPosition(screen.getByRole('table'))
      & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test('leaves the date out when the period end is unknown', () => {
    render(
      <CurrentSubscription
        status={SubscriptionStatus.Active}
        periodEnd={null}
      />,
    );

    expect(screen.queryByRole('rowheader', { name: 'Renews at' }))
      .not.toBeInTheDocument();
  });

  test('shows complimentary pro as on the house', () => {
    render(<CurrentSubscription status="complimentary" periodEnd={null} />);

    expect(rowOf('Status').getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('On the house. Enjoy!')).toBeInTheDocument();
  });
});
