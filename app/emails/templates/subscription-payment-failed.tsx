import { Link } from 'react-email';
import { Layout } from '../ui/layout/layout';
import { Typography } from '../ui/typography/typography';

const preview = 'Update your payment method to keep pencil case PRO.';

const body = 'The renewal payment for your pencil case PRO subscription '
  + 'did not go through. Creem, our payment partner, retries automatically '
  + 'over the next days, so a temporary card hiccup resolves itself.';

const action = 'To sort it out right away, update your payment method in '
  + 'the customer portal:';

const closing = 'If the payment keeps failing, the subscription ends and '
  + 'the paid features switch off — resubscribing brings them right back.';

export interface SubscriptionPaymentFailedEmailProps {
  portalUrl: string;
}

export function subscriptionPaymentFailedEmailSubject() {
  return 'Payment for pencil case PRO failed';
}

export function SubscriptionPaymentFailedEmail({
  portalUrl,
}: SubscriptionPaymentFailedEmailProps) {
  return (
    <Layout preview={preview}>
      <Typography
        variant="heading2"
        as="h1"
        textAlign="center"
        className="mb-3"
      >
        Your payment
        <br />
        did not go through
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-6">
        {body}
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-3">
        {action}
      </Typography>
      <Typography
        variant="bodySmall"
        fontWeight="semibold"
        textAlign="center"
        className="mb-6"
      >
        <Link
          href={portalUrl}
          className="text-pca-blue-700 underline"
        >
          Update payment method
        </Link>
      </Typography>
      <Typography variant="bodySmall" textAlign="center">
        {closing}
      </Typography>
    </Layout>
  );
}

SubscriptionPaymentFailedEmail.PreviewProps = {
  portalUrl: 'https://pencilcase.app/billing-portal',
} satisfies SubscriptionPaymentFailedEmailProps;

export default SubscriptionPaymentFailedEmail;
