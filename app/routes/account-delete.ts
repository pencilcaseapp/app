import { data, href, redirect, type MiddlewareFunction } from 'react-router';
import { z } from 'zod';
import { accountCopies } from '~/constants/account';
import { SearchParamAuth, SearchParamToast } from '~/constants/search-params';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { deleteAccount } from '~/services/account';
import { signOut } from '~/services/auth';
import { toDateParam } from '~/utils/date';
import { validateForm } from '~/utils/form';
import { addSearchParams, getNormalizedReturnUrl, withSearchParams } from '~/utils/url';
import type { Route } from './+types/account-delete';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({
  returnTo: z.string().optional(),
});

/**
 * Deletes the signed in user's account, posted to from the confirmation
 * dialog of the account settings, and sends them to the sign in page,
 * which says until when signing in again restores it. A failed deletion
 * goes back to the page it was asked from with a toast.
 */
export async function action({ request, context }: Route.ActionArgs) {
  const user = context.get(userSessionContext);
  const form = await validateForm(request, formSchema);

  if (!form.ok) {
    throw data('Bad Request', { status: 400 });
  }

  const [error, result] = await deleteAccount(user);

  if (error !== null) {
    return redirect(addSearchParams(
      getNormalizedReturnUrl(form.data.returnTo),
      { [SearchParamToast.ToastDanger]: accountCopies.deletionFailed },
    ));
  }

  return redirect(
    withSearchParams(href('/signin'), {
      [SearchParamAuth.RestoreUntil]: toDateParam(result.restoreUntil),
    }),
    {
      headers: {
        'Set-Cookie': await signOut(request),
      },
    },
  );
}
