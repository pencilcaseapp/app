import {
  href,
  redirect,
  redirectDocument,
  type MiddlewareFunction,
} from 'react-router';
import { z } from 'zod';
import { CurrentSubscription } from '~/components/current-subscription/current-subscription';
import { SettingsDialogContentInner } from '~/components/settings-dialog/settings-dialog';
import { SubscriptionUpgrade } from '~/components/subscription-upgrade/subscription-upgrade';
import { SearchParamToast } from '~/constants/search-params';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import {
  completeProCheckout,
  getSubscriptionOverview,
  startProCheckout,
} from '~/services/subscription';
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

  return {
    overview: overview.kind === 'subscribed'
      ? {
          kind: overview.kind,
          status: overview.status,
          periodEnd: overview.currentPeriodEnd
            ? formatDate(overview.currentPeriodEnd)
            : null,
        }
      : overview,
    hasBillingAccount: !!user.creemCustomerId,
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

/*
 * The subscription section: the upgrade offer, or the subscription
 * behind the pro features once there is one.
 */
export default function SettingsSubscriptionRoute({
  loaderData: { overview, hasBillingAccount },
}: Route.ComponentProps) {
  return (
    <SettingsDialogContentInner section="subscription">
      {overview.kind === 'none'
        ? <SubscriptionUpgrade />
        : (
            <CurrentSubscription
              status={overview.kind === 'subscribed'
                ? overview.status
                : 'complimentary'}
              periodEnd={overview.kind === 'subscribed'
                ? overview.periodEnd
                : null}
              hasBillingAccount={hasBillingAccount}
            />
          )}
    </SettingsDialogContentInner>
  );
}
