import type { FC } from 'react';
import { href } from 'react-router';
import { SubscriptionStatus } from '~/constants/subscription';
import { Button } from '~/ui/button/button';
import { Typography } from '~/ui/typography/typography';
import { PlanOverview } from '../plan-overview/plan-overview';

export interface CurrentSubscriptionProps {
  /** The status of the paid subscription, or `complimentary` for pro
   * features handed out without one. */
  status: SubscriptionStatus | 'complimentary';
  /** The formatted end of the running period, when known. */
  periodEnd: string | null;
}

export interface CurrentSubscriptionFooterProps {
  /** Whether there is a Creem customer to open the portal for. */
  hasBillingAccount: boolean;
}

function describeStatus(
  status: CurrentSubscriptionProps['status'],
  periodEnd: string | null,
) {
  switch (status) {
    case 'complimentary': {
      return 'On the house. Enjoy!';
    }

    case SubscriptionStatus.Trialing: {
      return periodEnd && `Trial ends at: ${periodEnd}`;
    }

    case SubscriptionStatus.ScheduledCancel: {
      return periodEnd ? `Cancelled. Active until: ${periodEnd}` : 'Cancelled.';
    }

    case SubscriptionStatus.PastDue: {
      return 'Payment failed. Update your payment method in the customer '
        + 'portal to keep Pro.';
    }

    default: {
      return periodEnd && `Renews at: ${periodEnd}`;
    }
  }
}

/*
 * The subscription settings of a user with the pro features: the plan
 * they are on, with the state of the subscription below the headline.
 */
export const CurrentSubscription: FC<CurrentSubscriptionProps> = ({
  status,
  periodEnd,
}) => (
  <PlanOverview
    image="welcoming-pencil"
    headline="You’re on Pencil Case Pro."
    subheadline={describeStatus(status, periodEnd)}
    currentPlan="pro"
  />
);

/*
 * The footer, pinned below the section: for a paying customer the link
 * into Creem's customer portal — it opens in a new tab so the settings
 * stay put.
 */
export const CurrentSubscriptionFooter: FC<CurrentSubscriptionFooterProps> = ({
  hasBillingAccount,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <Typography
      variant="bodyTiny"
      textColorLight="grey-600"
      textColorDark="grey-400"
    >
      {hasBillingAccount
        ? 'Billing lives in the Creem portal.'
        : 'You already have all pro features.'}
    </Typography>
    {hasBillingAccount && (
      <Button
        as="a"
        href={href('/billing-portal')}
        target="_blank"
        rel="noopener"
        icon="externalLink"
      >
        Manage subscription
      </Button>
    )}
  </div>
);
