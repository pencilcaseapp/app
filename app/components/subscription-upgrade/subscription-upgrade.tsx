import type { FC } from 'react';
import { Form, useNavigation } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { Button } from '~/ui/button/button';
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
 * user is on next to pro, under a headline about their own usage.
 */
export const SubscriptionUpgrade: FC<SubscriptionUpgradeProps> = ({
  documentCount,
}) => (
  <PlanOverview
    image="flying-docs"
    headline={headlineFor(documentCount)}
    subheadline="Unlimited docs, and you decide who gets in."
    currentPlan="free"
  />
);

/*
 * The offer's footer, pinned below the section: the button that posts
 * to the route's action, which starts the checkout.
 */
export const SubscriptionUpgradeFooter: FC = () => {
  const navigation = useNavigation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Typography
        variant="bodyTiny"
        textColorLight="grey-600"
        textColorDark="grey-400"
      >
        Secure checkout by Creem.
      </Typography>
      <Form method="post">
        <AuthenticityTokenInput />
        <Button type="submit" isLoading={navigation.state !== 'idle'}>
          Upgrade to Pro
        </Button>
      </Form>
    </div>
  );
};
