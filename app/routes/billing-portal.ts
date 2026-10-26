import { href, redirect, type MiddlewareFunction } from 'react-router';
import { SearchParamToast } from '~/constants/search-params';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import {
  getBillingPortalUrl,
  GetBillingPortalUrlError,
} from '~/services/subscription';
import { isNativeAppRequest } from '~/utils/native-app';
import { withSearchParams } from '~/utils/url';
import type { Route } from './+types/billing-portal';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

/** The native apps manage no billing (`docs/native-apps.md`). */
export async function loader({ request, context }: Route.LoaderArgs) {
  if (isNativeAppRequest(request)) {
    return redirect(href('/upgrade'));
  }

  const user = context.get(userSessionContext);
  const [error, result] = await getBillingPortalUrl(user);

  if (error === null) {
    return redirect(result.portalUrl);
  }

  switch (error) {
    case GetBillingPortalUrlError.NoCreemCustomer: {
      return redirect(withSearchParams(href('/upgrade'), {
        [SearchParamToast.ToastDanger]:
          'There is no billing account for you yet.',
      }));
    }

    case GetBillingPortalUrlError.PortalFailed: {
      return redirect(withSearchParams(href('/upgrade'), {
        [SearchParamToast.ToastDanger]:
          'Opening the customer portal failed. Please try again.',
      }));
    }

    default: {
      const exhaustiveCheck: never = error;
      throw new Error(`Unhandled error: ${exhaustiveCheck}`);
    }
  }
}
