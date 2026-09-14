import {
  Form,
  href,
  redirect,
  redirectDocument,
  useNavigation,
  type MiddlewareFunction,
} from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z } from 'zod';
import { SettingsDialogContentInner } from '~/components/settings-dialog/settings-dialog';
import {
  FREE_PLAN,
  PLAN_MATRIX_PLANS,
  PLAN_MATRIX_ROWS,
  PRO_PLAN,
} from '~/constants/plans';
import { SearchParamToast } from '~/constants/search-params';
import {
  FREE_DOCUMENT_LIMIT,
  SubscriptionStatus,
} from '~/constants/subscription';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { getDocumentList } from '~/repos/document';
import {
  completeProCheckout,
  getSubscriptionOverview,
  startProCheckout,
} from '~/services/subscription';
import { Badge } from '~/ui/badge/badge';
import { Button } from '~/ui/button/button';
import { PlanMatrix } from '~/ui/plan-matrix/plan-matrix';
import { PricingCard } from '~/ui/pricing-card/pricing-card';
import { Typography } from '~/ui/typography/typography';
import { formatDate } from '~/utils/date';
import { validateForm } from '~/utils/form';
import { withSearchParams } from '~/utils/url';
import type { Route } from './+types/settings-subscription';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({});

/**
 * The checkout sends the user back here, to the settings over the
 * document they upgraded from, with Creem's signed parameters
 * appended. They are confirmed and dropped through a redirect, so the
 * page they land on is the plain subscription view plus a toast.
 */
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);
  const { searchParams } = new URL(request.url);
  const subscriptionUrl
    = href('/doc/:id/settings/subscription', { id: params.id });

  if (searchParams.has('checkout_id')) {
    const [error] = await completeProCheckout(searchParams);

    return redirect(withSearchParams(subscriptionUrl, error === null
      ? {
          [SearchParamToast.ToastSuccess]:
            'Welcome to Pro! Your subscription is active.',
        }
      : {
          [SearchParamToast.ToastDanger]:
            'We could not confirm the payment. If you were charged, Pro '
            + 'activates on its own within a few minutes.',
        }));
  }

  const overview = await getSubscriptionOverview(user);
  const documents = overview.kind === 'none'
    ? await getDocumentList(user.id)
    : [];

  return {
    overview: overview.kind === 'subscribed'
      ? {
          kind: overview.kind,
          status: overview.status,
          periodEnd: overview.currentPeriodEnd
            ? formatDate(overview.currentPeriodEnd, request)
            : null,
        }
      : overview,
    hasBillingAccount: !!user.creemCustomerId,
    documentCount: documents.length,
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);
  const user = context.get(userSessionContext);
  const subscriptionUrl
    = href('/doc/:id/settings/subscription', { id: params.id });

  if (!form.ok) {
    return form.formState;
  }

  const overview = await getSubscriptionOverview(user);

  if (overview.kind !== 'none') {
    return redirect(subscriptionUrl);
  }

  const successUrl = new URL(subscriptionUrl, request.url).toString();
  const [error, result] = await startProCheckout(user, successUrl);

  if (error !== null) {
    return redirect(withSearchParams(subscriptionUrl, {
      [SearchParamToast.ToastDanger]:
        'Starting the checkout failed. Please try again.',
    }));
  }

  return redirectDocument(result.checkoutUrl);
}

type Overview = Route.ComponentProps['loaderData']['overview'];

const headlineFor = (overview: Overview, documentCount: number) => {
  if (overview.kind !== 'none') {
    return 'You’re on Pencil Case Pro.';
  }

  if (documentCount >= FREE_DOCUMENT_LIMIT) {
    return `You’ve used all ${FREE_DOCUMENT_LIMIT} of your free docs.`;
  }

  return `You’ve used ${documentCount} of your ${FREE_DOCUMENT_LIMIT} free docs.`;
};

const subheadlineFor = (overview: Overview) => {
  if (overview.kind === 'none') {
    return 'Unlimited docs, and you decide who gets in.';
  }

  if (overview.kind === 'complimentary') {
    return 'On the house. Enjoy!';
  }

  const { status, periodEnd } = overview;

  switch (status) {
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
};

/*
 * The subscription section: a headline about the reader's own usage
 * or subscription, the two plans as compact pricing cards and the
 * feature matrix below, with the action pinned in the footer — the
 * checkout for a free user, the customer portal once subscribed. The
 * checkout runs through this route's action, so the dialog stays
 * where it is until Creem takes over. See docs/design-decisions.md
 * for what was tried instead.
 */
export default function SettingsSubscriptionRoute({
  loaderData: { overview, hasBillingAccount, documentCount },
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const hasSubscription = overview.kind !== 'none';
  const image = hasSubscription ? 'welcoming-pencil' : 'flying-docs';
  const subheadline = subheadlineFor(overview);

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
          && 'You already have all pro features.'}
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
            {headlineFor(overview, documentCount)}
          </Typography>
          {subheadline && (
            <Typography
              variant="bodySmall"
              textAlign="center"
              textColorLight="grey-600"
              textColorDark="grey-400"
              className="mt-1.5"
            >
              {subheadline}
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
