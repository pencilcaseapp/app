import type { FC } from 'react';
import { href } from 'react-router';
import { SubscriptionStatus } from '~/constants/subscription';
import { Badge, type BadgeVariant } from '~/ui/badge/badge';
import { Button } from '~/ui/button/button';
import { Notification } from '~/ui/notification/notification';
import { Typography } from '~/ui/typography/typography';
import { PlanOverview } from '../plan-overview/plan-overview';

export interface CurrentSubscriptionProps {
  /** The status of the paid subscription, or `complimentary` for pro
   * features handed out without one. */
  status: SubscriptionStatus | 'complimentary';
  /** The formatted end of the running period, when known. */
  periodEnd: string | null;
}

type StatusPresentation = {
  badge: BadgeVariant;
  label: string;
  /** The date that matters for the status, as a row of its own. */
  date?: { label: string; value: string };
  /** A remark in place of a date. */
  note?: string;
  /** Something the user has to act on. */
  notice?: string;
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
        note: 'On the house. Enjoy!',
      };
    }

    case SubscriptionStatus.Trialing: {
      return {
        badge: 'success',
        label: 'Trial',
        date: periodEnd
          ? { label: 'Trial ends at', value: periodEnd }
          : undefined,
      };
    }

    case SubscriptionStatus.ScheduledCancel: {
      return {
        badge: 'warning',
        label: 'Cancelled',
        date: periodEnd
          ? { label: 'Active until', value: periodEnd }
          : undefined,
      };
    }

    case SubscriptionStatus.PastDue: {
      return {
        badge: 'danger',
        label: 'Payment failed',
        notice: 'Update your payment method in the customer portal to '
          + 'keep Pro.',
      };
    }

    default: {
      return {
        badge: 'success',
        label: 'Active',
        date: periodEnd
          ? { label: 'Renews at', value: periodEnd }
          : undefined,
      };
    }
  }
}

// The rows speak the plan matrix's language: label left, value right.
const rowClasses = 'border-t border-pca-grey-200 dark:border-pca-grey-800';
const labelClasses = 'py-2 pr-2 text-left align-middle';
const valueClasses = 'h-11 text-right align-middle';

/*
 * The subscription settings of a user with the pro features. There is
 * nothing left to compare, so the plan matrix makes way for the
 * subscription itself: its status and the date that goes with it.
 */
export const CurrentSubscription: FC<CurrentSubscriptionProps> = ({
  status,
  periodEnd,
}) => {
  const { badge, label, date, note, notice } = presentStatus(status, periodEnd);

  return (
    <PlanOverview
      image="pencil-and-doc"
      headline="You’re on Pencil Case Pro."
      currentPlan="pro"
    >
      <div className="flex flex-col gap-3">
        {notice && <Notification variant="danger" title={notice} />}
        <table className="w-full border-collapse">
          <caption className="sr-only">Your subscription</caption>
          <tbody>
            <tr className={rowClasses}>
              <th scope="row" className={labelClasses}>
                <Typography as="span" variant="bodySmall" fontWeight="medium">
                  Status
                </Typography>
              </th>
              <td className={valueClasses}>
                <Badge variant={badge}>{label}</Badge>
              </td>
            </tr>
            {date && (
              <tr className={rowClasses}>
                <th scope="row" className={labelClasses}>
                  <Typography
                    as="span"
                    variant="bodySmall"
                    fontWeight="medium"
                  >
                    {date.label}
                  </Typography>
                </th>
                <td className={valueClasses}>
                  <Typography
                    as="span"
                    variant="bodySmall"
                    fontWeight="semibold"
                    className="tabular-nums"
                  >
                    {date.value}
                  </Typography>
                </td>
              </tr>
            )}
            {note && (
              <tr className={rowClasses}>
                <td colSpan={2} className="py-3">
                  <Typography
                    variant="bodySmall"
                    textColorLight="grey-600"
                    textColorDark="grey-400"
                  >
                    {note}
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PlanOverview>
  );
};

/*
 * The footer of a paying customer, pinned below the section: the link
 * into Creem's customer portal — it opens in a new tab so the settings
 * stay put.
 */
export const CurrentSubscriptionFooter: FC = () => (
  <div className="flex justify-end">
    <Button
      as="a"
      href={href('/billing-portal')}
      target="_blank"
      rel="noopener"
      icon="externalLink"
    >
      Manage subscription
    </Button>
  </div>
);
