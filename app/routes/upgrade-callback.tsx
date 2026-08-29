import { href, Link, type MiddlewareFunction } from 'react-router';
import { PageTitle } from '~/components/page-title/page-title';
import { authMiddleware } from '~/middleware/auth';
import { completeProCheckout } from '~/services/subscription';
import { Button } from '~/ui/button/button';
import { Notification } from '~/ui/notification/notification';
import { Typography } from '~/ui/typography/typography';
import type { Route } from './+types/upgrade-callback';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const [error] = await completeProCheckout(searchParams);

  return { confirmed: error === null };
}

export default function UpgradeCallback({
  loaderData,
}: Route.ComponentProps) {
  if (!loaderData.confirmed) {
    return (
      <>
        <PageTitle>Upgrade</PageTitle>
        <Notification
          variant="warning"
          title="We could not confirm this payment."
          className="mb-5"
        />
        <Typography
          variant="bodySmall"
          textColorLight="grey-900"
          textColorDark="white"
          className="mb-6 text-center px-10"
        >
          If you were charged, your subscription activates on its own
          within a few minutes. Otherwise, head back and try again.
        </Typography>
        <Button
          as={Link}
          to={href('/upgrade')}
          colorLight="secondary"
          colorDark="secondary"
          className="mb-10 w-full"
        >
          Back to the upgrade page
        </Button>
      </>
    );
  }

  return (
    <>
      <PageTitle>Welcome to PRO</PageTitle>
      <Typography
        variant="heading2"
        textColorLight="black"
        textColorDark="white"
        className="mb-3 text-center"
      >
        You are all set!
      </Typography>
      <Typography
        variant="bodySmall"
        textColorLight="grey-900"
        textColorDark="white"
        className="mb-6 text-center px-10"
      >
        Thanks for upgrading — pencil case PRO is now active. Creem sends
        your receipt by email.
      </Typography>
      <Button
        as={Link}
        to={href('/')}
        colorLight="primary"
        colorDark="upgrade"
        className="mb-10 w-full"
      >
        Start writing
      </Button>
    </>
  );
}
