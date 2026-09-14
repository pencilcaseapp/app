import type { FC } from 'react';
import { href } from 'react-router';
import { PRO_PLAN, SubscriptionStatus } from '~/constants/subscription';
import { Badge, type BadgeVariant } from '~/ui/badge/badge';
import { Icon } from '~/ui/icon/icon';
import { NavigationItem } from '~/ui/navigation-item/navigation-item';
import { PlanSummary } from '~/ui/plan-summary/plan-summary';

export interface CurrentSubscriptionProps {
  /** The status of the paid subscription, or `complimentary` for pro
   * features handed out without one. */
  status: SubscriptionStatus | 'complimentary';
  /** The formatted end of the running period, when known. */
  periodEnd: string | null;
  /** Whether there is a Creem customer to open the portal for. */
  hasBillingAccount: boolean;
}

type StatusPresentation = {
  badge: BadgeVariant;
  label: string;
  detail?: string;
  withPrice: boolean;
};

function presentStatus(
  status: CurrentSubscriptionProps['status'],
  periodEnd: string | null,
): StatusPresentation {
  switch (status) {
    case 'complimentary': {
      return {
        badge: 'success',
        label: 'Active',
        detail: 'On the house. Enjoy!',
        withPrice: false,
      };
    }

    case SubscriptionStatus.Trialing: {
      return {
        badge: 'success',
        label: 'Trial',
        detail: periodEnd ? `Trial ends at: ${periodEnd}` : undefined,
        withPrice: true,
      };
    }

    case SubscriptionStatus.ScheduledCancel: {
      return {
        badge: 'warning',
        label: 'Cancelled',
        detail: periodEnd ? `Active until: ${periodEnd}` : undefined,
        withPrice: true,
      };
    }

    case SubscriptionStatus.PastDue: {
      return {
        badge: 'danger',
        label: 'Payment failed',
        detail: 'Update your payment method in the customer portal to '
          + 'keep Pro.',
        withPrice: true,
      };
    }

    default: {
      return {
        badge: 'success',
        label: 'Active',
        detail: periodEnd ? `Renews at: ${periodEnd}` : undefined,
        withPrice: true,
      };
    }
  }
}

const externalLink = (
  <Icon icon="externalLink" className="m-1 text-pca-grey-400" />
);

/*
 * The subscription settings of a user with the pro features: the plan
 * with its status and, for a paying customer, the link into Creem's
 * customer portal — it opens in a new tab so the settings stay put.
 */
export const CurrentSubscription: FC<CurrentSubscriptionProps> = ({
  status,
  periodEnd,
  hasBillingAccount,
}) => {
  const presentation = presentStatus(status, periodEnd);

  return (
    <div className="flex flex-col gap-6">
      <PlanSummary
        product={PRO_PLAN.product}
        plan={PRO_PLAN.name}
        price={presentation.withPrice ? PRO_PLAN.price : undefined}
        period={presentation.withPrice ? PRO_PLAN.period : undefined}
        badge={(
          <Badge variant={presentation.badge}>{presentation.label}</Badge>
        )}
        detail={presentation.detail}
      />
      {hasBillingAccount && (
        <NavigationItem
          as="a"
          href={href('/billing-portal')}
          target="_blank"
          rel="noopener"
          icon="euro"
          title="Manage Subscription"
          actionArea={externalLink}
          isActionAreaVisible
        />
      )}
    </div>
  );
};
