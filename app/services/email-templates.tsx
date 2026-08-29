import { href } from 'react-router';
import { getConfig } from '~/config';
import { OtpCodeEmail, otpCodeEmailSubject } from '~/emails/templates/otp-code';
import {
  SubscriptionCanceledEmail,
  subscriptionCanceledEmailSubject,
} from '~/emails/templates/subscription-canceled';
import {
  SubscriptionPaymentFailedEmail,
  subscriptionPaymentFailedEmailSubject,
} from '~/emails/templates/subscription-payment-failed';
import {
  SubscriptionStartedEmail,
  subscriptionStartedEmailSubject,
} from '~/emails/templates/subscription-started';
import { sendEmail, type EmailData } from './email';

const config = getConfig();

export async function sendEmailMagicCode(input: {
  to: EmailData;
  code: string;
}) {
  const { to, code } = input;

  await sendEmail({
    to,
    subject: otpCodeEmailSubject(code),
    email: <OtpCodeEmail code={code} />,
  });
}

export async function sendEmailSubscriptionStarted(input: {
  to: EmailData;
}) {
  const { to } = input;

  await sendEmail({
    to,
    subject: subscriptionStartedEmailSubject(),
    email: <SubscriptionStartedEmail />,
  });
}

export async function sendEmailSubscriptionPaymentFailed(input: {
  to: EmailData;
}) {
  const { to } = input;

  await sendEmail({
    to,
    subject: subscriptionPaymentFailedEmailSubject(),
    email: (
      <SubscriptionPaymentFailedEmail
        portalUrl={`${config.appUrl}${href('/billing-portal')}`}
      />
    ),
  });
}

export async function sendEmailSubscriptionCanceled(input: {
  to: EmailData;
}) {
  const { to } = input;

  await sendEmail({
    to,
    subject: subscriptionCanceledEmailSubject(),
    email: (
      <SubscriptionCanceledEmail
        upgradeUrl={`${config.appUrl}${href('/upgrade')}`}
      />
    ),
  });
}
