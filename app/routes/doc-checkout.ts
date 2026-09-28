import { href, redirect, type MiddlewareFunction } from 'react-router';
import { SearchParamToast } from '~/constants/search-params';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import {
  getSubscriptionOverview,
  startProCheckout,
} from '~/services/subscription';
import { withSearchParams } from '~/utils/url';
import type { Route } from './+types/doc-checkout';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

/**
 * Starts the pro checkout and sends the browser on to Creem. A plain
 * link points here rather than a form, so coming back from the
 * checkout with the back button finds the page as it was, not a
 * submission still pending. The success URL is the subscription
 * section over the same document, whose loader confirms the checkout.
 */
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);
  const subscriptionUrl
    = href('/doc/:id/settings/subscription', { id: params.id });
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

  return redirect(result.checkoutUrl);
}
