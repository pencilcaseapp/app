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
import { PageTitle } from '~/components/page-title/page-title';
import { SearchParamToast } from '~/constants/search-params';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import { startProCheckout } from '~/services/subscription';
import { Button } from '~/ui/button/button';
import { Typography } from '~/ui/typography/typography';
import { validateForm } from '~/utils/form';
import { withSearchParams } from '~/utils/url';
import type { Route } from './+types/upgrade';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

const formSchema = z.object({});

export function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userSessionContext);

  return {
    hasSubscription: user.hasSubscription,
    hasBillingAccount: !!user.creemCustomerId,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await validateForm(request, formSchema);
  const user = context.get(userSessionContext);

  if (!form.ok) {
    return form.formState;
  }

  if (user.hasSubscription) {
    return redirect(href('/upgrade'));
  }

  const successUrl
    = new URL(href('/upgrade/callback'), request.url).toString();
  const [error, result] = await startProCheckout(user, successUrl);

  if (error !== null) {
    return redirect(withSearchParams(href('/upgrade'), {
      [SearchParamToast.ToastDanger]:
        'Starting the checkout failed. Please try again.',
    }));
  }

  return redirectDocument(result.checkoutUrl);
}

export default function Upgrade({ loaderData }: Route.ComponentProps) {
  const { hasSubscription, hasBillingAccount } = loaderData;
  const navigation = useNavigation();

  return (
    <>
      <PageTitle>Upgrade</PageTitle>
      <Typography
        variant="heading2"
        textColorLight="black"
        textColorDark="white"
        className="mb-3 text-center"
      >
        pencil case PRO
      </Typography>
      {!hasSubscription && (
        <>
          <Typography
            variant="bodySmall"
            textColorLight="grey-900"
            textColorDark="white"
            className="mb-6 text-center px-10"
          >
            Everything pencil case has to offer, for 25&nbsp;€ a year.
            The upgrade takes you to the secure checkout of Creem, our
            merchant of record.
          </Typography>
          <Form method="post" className="block">
            <AuthenticityTokenInput />
            <Button
              type="submit"
              isLoading={navigation.state !== 'idle'}
              colorLight="primary"
              colorDark="upgrade"
              className="mb-10 w-full"
            >
              Upgrade
            </Button>
          </Form>
        </>
      )}
      {hasSubscription && hasBillingAccount && (
        <>
          <Typography
            variant="bodySmall"
            textColorLight="grey-900"
            textColorDark="white"
            className="mb-6 text-center px-10"
          >
            You have pencil case PRO. Manage your subscription, payment
            method and invoices in the customer portal — it opens in a
            new tab.
          </Typography>
          <Button
            as="a"
            href={href('/billing-portal')}
            target="_blank"
            rel="noopener"
            colorLight="primary"
            colorDark="upgrade"
            className="mb-10 w-full"
          >
            Manage subscription
          </Button>
        </>
      )}
      {hasSubscription && !hasBillingAccount && (
        <Typography
          variant="bodySmall"
          textColorLight="grey-900"
          textColorDark="white"
          className="mb-10 text-center px-10"
        >
          You already have all pro features. Enjoy!
        </Typography>
      )}
    </>
  );
}
