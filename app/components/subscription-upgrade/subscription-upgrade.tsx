import type { FC } from 'react';
import { Form, useNavigation } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { PRO_PLAN } from '~/constants/subscription';
import { Button } from '~/ui/button/button';
import { IllustrationCircle } from '~/ui/illustration-circle/illustration-circle';
import { ListItem } from '~/ui/list-item/list-item';
import { PlanSummary } from '~/ui/plan-summary/plan-summary';

/*
 * The upgrade offer of the subscription settings: the pro plan with
 * its features and the button that posts to the route's action, which
 * starts the checkout.
 */
export const SubscriptionUpgrade: FC = () => {
  const navigation = useNavigation();

  return (
    <div className="flex flex-col">
      <div className="flex justify-center pt-5 pb-6">
        <IllustrationCircle src="/upgrade-pencil@2x.png" />
      </div>
      <PlanSummary
        product={PRO_PLAN.product}
        plan={PRO_PLAN.name}
        price={PRO_PLAN.price}
        period={PRO_PLAN.period}
        className="pb-4"
      />
      <Form method="post">
        <AuthenticityTokenInput />
        <Button
          type="submit"
          isLoading={navigation.state !== 'idle'}
          colorLight="upgrade"
          colorDark="upgrade"
          className="w-full"
        >
          Upgrade to Pro
        </Button>
      </Form>
      <ul className="mt-6 flex flex-col gap-3">
        {PRO_PLAN.features.map(feature => (
          <ListItem
            key={feature}
            iconSize="medium"
            iconColorLight="green-700"
            iconColorDark="green-700"
            textColorLight="grey-800"
          >
            {feature}
          </ListItem>
        ))}
      </ul>
    </div>
  );
};
