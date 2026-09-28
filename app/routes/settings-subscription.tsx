import { href, redirect, type MiddlewareFunction } from 'react-router';
import {
  CurrentSubscription,
  CurrentSubscriptionFooter,
} from '~/components/current-subscription/current-subscription';
import { SettingsDialogContentInner } from '~/components/settings-dialog/settings-dialog';
import { SubscriptionUpgrade } from '~/components/subscription-upgrade/subscription-upgrade';
import { SearchParamToast } from '~/constants/search-params';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { getDocumentList } from '~/repos/document';
import {
  completeProCheckout,
  getSubscriptionOverview,
} from '~/services/subscription';
import { formatDate } from '~/utils/date';
import { withSearchParams } from '~/utils/url';
import type { Route } from './+types/settings-subscription';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

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

/*
 * The subscription section: the upgrade offer, or the subscription
 * behind the pro features once there is one. Each view's action sits
 * in the dialog's footer; complimentary pro has no Creem customer to
 * manage, and so no footer.
 */
export default function SettingsSubscriptionRoute({
  params: { id: documentId },
  loaderData: { overview, hasBillingAccount, documentCount },
}: Route.ComponentProps) {
  if (overview.kind === 'none') {
    return (
      <SubscriptionUpgrade
        documentCount={documentCount}
        documentId={documentId}
      />
    );
  }

  return (
    <SettingsDialogContentInner
      section="subscription"
      footerArea={hasBillingAccount && <CurrentSubscriptionFooter />}
    >
      <CurrentSubscription
        status={overview.kind === 'subscribed'
          ? overview.status
          : 'complimentary'}
        periodEnd={overview.kind === 'subscribed'
          ? overview.periodEnd
          : null}
      />
    </SettingsDialogContentInner>
  );
}
