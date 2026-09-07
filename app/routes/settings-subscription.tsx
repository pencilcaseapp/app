import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import {
  Form,
  href,
  redirect,
  redirectDocument,
  useNavigation,
  type MiddlewareFunction,
} from 'react-router';
import { z } from 'zod';
import { SettingsDialogContentInner } from '~/components/settings-dialog/settings-dialog';
import {
  FREE_PLAN,
  PLAN_MATRIX_PLANS,
  PLAN_MATRIX_ROWS,
  PRO_PLAN,
} from '~/constants/plans';
import { SearchParamToast } from '~/constants/search-params';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { getDocumentList } from '~/repos/document';
import { startProCheckout } from '~/services/subscription';
import { Badge } from '~/ui/badge/badge';
import { Button } from '~/ui/button/button';
import { PlanMatrix } from '~/ui/plan-matrix/plan-matrix';
import { PricingCard } from '~/ui/pricing-card/pricing-card';
import { Typography } from '~/ui/typography/typography';
import { validateForm } from '~/utils/form';
import { withSearchParams } from '~/utils/url';
import type { Route } from './+types/settings-subscription';

const formSchema = z.object({});

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);
  const documents = user.hasSubscription ? [] : await getDocumentList(user.id);

  return {
    hasSubscription: user.hasSubscription,
    hasBillingAccount: !!user.creemCustomerId,
    documentCount: documents.length,
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);
  const user = context.get(userSessionContext);
  const subscriptionUrl = href('/doc/:id/settings/subscription', params);

  if (!form.ok) {
    return form.formState;
  }

  if (user.hasSubscription) {
    return redirect(subscriptionUrl);
  }

  const successUrl
    = new URL(href('/upgrade/callback'), request.url).toString();
  const [error, result] = await startProCheckout(user, successUrl);

  if (error !== null) {
    return redirect(withSearchParams(subscriptionUrl, {
      [SearchParamToast.ToastDanger]:
        'Starting the checkout failed. Please try again.',
    }));
  }

  return redirectDocument(result.checkoutUrl);
}

const headlineFor = (documentCount: number, hasSubscription: boolean) => {
  if (hasSubscription) {
    return 'You’re on Pencil Case Pro.';
  }

  if (documentCount >= FREE_DOCUMENT_LIMIT) {
    return `You’ve used all ${FREE_DOCUMENT_LIMIT} of your free docs.`;
  }

  return `You’ve used ${documentCount} of your ${FREE_DOCUMENT_LIMIT} free docs.`;
};

/*
 * The subscription section: a headline about the reader's own usage,
 * the two plans as compact pricing cards and the feature matrix below,
 * with the action pinned in the footer — the checkout for a free user,
 * the customer portal once subscribed. The checkout runs through this
 * route's action, so the dialog stays where it is until Creem takes
 * over. See docs/design-decisions.md for what was tried instead.
 */
export default function SettingsSubscriptionRoute({
  loaderData: { hasSubscription, hasBillingAccount, documentCount },
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const image = hasSubscription ? 'welcoming-pencil' : 'flying-docs';

  const footerArea = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Typography
        variant="bodyTiny"
        textColorLight="grey-600"
        textColorDark="grey-400"
      >
        {!hasSubscription && 'Secure checkout by Creem.'}
        {hasSubscription && hasBillingAccount
          && 'Billing lives in the Creem portal.'}
        {hasSubscription && !hasBillingAccount
          && 'You already have all pro features. Enjoy!'}
      </Typography>
      {!hasSubscription && (
        <Form method="post">
          <AuthenticityTokenInput />
          <Button type="submit" isLoading={navigation.state !== 'idle'}>
            Upgrade to Pro
          </Button>
        </Form>
      )}
      {hasSubscription && hasBillingAccount && (
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

  return (
    <SettingsDialogContentInner
      section="subscription"
      footerArea={footerArea}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center pt-1 text-center">
          <picture>
            <source
              srcSet={`/${image}-dark.svg`}
              media="(prefers-color-scheme: dark)"
            />
            <img
              src={`/${image}-light.svg`}
              className="mb-2 block h-24 w-auto"
              width="180"
              height="132"
              alt=""
            />
          </picture>
          <Typography
            variant="heading2"
            as="h3"
            textAlign="center"
            className="text-balance"
          >
            {headlineFor(documentCount, hasSubscription)}
          </Typography>
          {!hasSubscription && (
            <Typography
              variant="bodySmall"
              textAlign="center"
              textColorLight="grey-600"
              textColorDark="grey-400"
              className="mt-1.5"
            >
              Unlimited docs, and you decide who gets in.
            </Typography>
          )}
        </div>
        <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3">
          <PricingCard
            plan={FREE_PLAN.plan}
            amount={FREE_PLAN.amount}
            period={FREE_PLAN.period}
            size="compact"
            background="white"
            badge={!hasSubscription && (
              <Badge variant="neutral">Current</Badge>
            )}
          />
          <PricingCard
            plan={PRO_PLAN.plan}
            amount={PRO_PLAN.amount}
            period={PRO_PLAN.period}
            size="compact"
            badge={hasSubscription && <Badge variant="dark">Current</Badge>}
          />
        </div>
        <PlanMatrix
          caption="What the free and the pro plan include"
          plans={PLAN_MATRIX_PLANS}
          rows={PLAN_MATRIX_ROWS}
        />
      </div>
    </SettingsDialogContentInner>
  );
}
