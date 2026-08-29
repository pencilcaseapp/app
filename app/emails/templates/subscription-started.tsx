import { Layout } from '../ui/layout/layout';
import { Typography } from '../ui/typography/typography';

const preview = 'Your PRO subscription is active. Enjoy!';

const body = 'Your pencil case PRO subscription is active and all paid '
  + 'features are switched on. Thanks a lot for supporting us!';

const receiptNote = 'Creem, our payment partner, sends your receipt and '
  + 'invoice in a separate email. Their customer portal is also where you '
  + 'manage your payment method and subscription — you can reach it any '
  + 'time from the upgrade page.';

export function subscriptionStartedEmailSubject() {
  return 'Welcome to pencil case PRO';
}

export function SubscriptionStartedEmail() {
  return (
    <Layout preview={preview}>
      <Typography
        variant="heading2"
        as="h1"
        textAlign="center"
        className="mb-3"
      >
        Welcome to
        <br />
        pencil case PRO
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-6">
        {body}
      </Typography>
      <Typography variant="bodySmall" textAlign="center">
        {receiptNote}
      </Typography>
    </Layout>
  );
}

export default SubscriptionStartedEmail;
