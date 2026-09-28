import type { FC } from 'react';
import { href } from 'react-router';
import { PLAN_MATRIX_PLANS, PLAN_MATRIX_ROWS } from '~/constants/plans';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { Button } from '~/ui/button/button';
import { PlanMatrix } from '~/ui/plan-matrix/plan-matrix';
import { Typography } from '~/ui/typography/typography';
import { PlanOverview } from '../plan-overview/plan-overview';
import { SettingsDialogContentInner } from '../settings-dialog/settings-dialog';

export interface SubscriptionUpgradeProps {
  /** The user's docs, counted against the free limit. */
  documentCount: number;
  /** The document the settings are open over, which the checkout
   * returns to. */
  documentId: string;
}

const headlineFor = (documentCount: number) => {
  if (documentCount >= FREE_DOCUMENT_LIMIT) {
    return `You’ve used all ${FREE_DOCUMENT_LIMIT} of your free docs.`;
  }

  return `You’ve used ${documentCount} of your ${FREE_DOCUMENT_LIMIT} free docs.`;
};

/*
 * The upgrade offer of the subscription settings: the free plan the
 * user is on next to pro, under a headline about their own usage, and
 * what the two plans include below. The footer links to the route that
 * starts the checkout on Creem's side — a link rather than a form, so
 * the button is not left loading when the user comes back from Creem
 * with the back button.
 */
export const SubscriptionUpgrade: FC<SubscriptionUpgradeProps> = ({
  documentCount,
  documentId,
}) => (
  <SettingsDialogContentInner
    section="subscription"
    footerArea={(
      <div className="flex justify-end">
        <Button
          as="a"
          href={href('/doc/:id/checkout', { id: documentId })}
          colorLight="yellow-500"
          colorDark="yellow-500"
          icon="externalLink"
        >
          Upgrade to Pro
        </Button>
      </div>
    )}
  >
    <PlanOverview
      image="flying-docs"
      headline={headlineFor(documentCount)}
      subheadline="Unlimited docs, and you decide who gets in."
      currentPlan="free"
    >
      <Typography
        variant="bodyTiny"
        textAlign="center"
        textColorLight="grey-600"
        textColorDark="grey-400"
        className="-mt-2"
      >
        Secure checkout by Creem.
      </Typography>
      <PlanMatrix
        caption="What the free and the pro plan include"
        plans={PLAN_MATRIX_PLANS}
        rows={PLAN_MATRIX_ROWS}
      />
    </PlanOverview>
  </SettingsDialogContentInner>
);
