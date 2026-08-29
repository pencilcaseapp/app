import { Link } from 'react-email';
import { Layout } from '../ui/layout/layout';
import { Typography } from '../ui/typography/typography';

const preview = 'Your PRO subscription has ended.';

const body = 'Your pencil case PRO subscription has ended and the paid '
  + 'features are switched off. Your documents stay right where they are.';

const closing = 'Changed your mind? Resubscribe any time and everything '
  + 'is back:';

export interface SubscriptionCanceledEmailProps {
  upgradeUrl: string;
}

export function subscriptionCanceledEmailSubject() {
  return 'Your pencil case PRO subscription has ended';
}

export function SubscriptionCanceledEmail({
  upgradeUrl,
}: SubscriptionCanceledEmailProps) {
  return (
    <Layout preview={preview}>
      <Typography
        variant="heading2"
        as="h1"
        textAlign="center"
        className="mb-3"
      >
        Sad to
        <br />
        see you go
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-6">
        {body}
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-3">
        {closing}
      </Typography>
      <Typography
        variant="bodySmall"
        fontWeight="semibold"
        textAlign="center"
      >
        <Link
          href={upgradeUrl}
          className="text-pca-blue-700 underline"
        >
          Get pencil case PRO
        </Link>
      </Typography>
    </Layout>
  );
}

SubscriptionCanceledEmail.PreviewProps = {
  upgradeUrl: 'https://pencilcase.app/upgrade',
} satisfies SubscriptionCanceledEmailProps;

export default SubscriptionCanceledEmail;
