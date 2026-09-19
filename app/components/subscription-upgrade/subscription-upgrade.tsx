import type { FC } from 'react';
import { Form, useNavigation } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { PLAN_MATRIX_PLANS, PLAN_MATRIX_ROWS } from '~/constants/plans';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { Button } from '~/ui/button/button';
import { PlanMatrix } from '~/ui/plan-matrix/plan-matrix';
import { Typography } from '~/ui/typography/typography';
import { PlanOverview } from '../plan-overview/plan-overview';

export interface SubscriptionUpgradeProps {
  /** The user's docs, counted against the free limit. */
  documentCount: number;
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
 * what the two plans include below.
 */
export const SubscriptionUpgrade: FC<SubscriptionUpgradeProps> = ({
  documentCount,
}) => (
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
);

/*
 * The offer's footer, pinned below the section: the button that posts
 * to the route's action, which starts the checkout on Creem's side —
 * hence the external link icon.
 */
export const SubscriptionUpgradeFooter: FC = () => {
  const navigation = useNavigation();

  return (
    <Form method="post" className="flex justify-end">
      <AuthenticityTokenInput />
      <Button
        type="submit"
        isLoading={navigation.state !== 'idle'}
        colorLight="yellow-500"
        colorDark="yellow-500"
        icon="externalLink"
      >
        Upgrade to Pro
      </Button>
    </Form>
  );
};
