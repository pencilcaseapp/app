import { href } from 'react-router';
import { getConfig } from '~/config';
import {
  EmailChangeCodeEmail,
  emailChangeCodeEmailSubject,
} from '~/emails/templates/email-change-code';
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
import { EmailTemplate } from '~/constants/email';
import { sendEmail, type EmailData } from './email';

const config = getConfig();

export async function sendEmailMagicCode(input: {
  to: EmailData;
  code: string;
  otpId: string;
  userId?: string;
}) {
  const { to, code, otpId, userId } = input;

  await sendEmail({
    to,
    subject: otpCodeEmailSubject(code),
    email: <OtpCodeEmail code={code} />,
    template: EmailTemplate.OtpCode,
    idempotencyScope: otpId,
    userId,
  });
}

export async function sendEmailChangeCode(input: {
  to: EmailData;
  code: string;
  requestId: string;
  userId: string;
}) {
  const { to, code, requestId, userId } = input;

  await sendEmail({
    to,
    subject: emailChangeCodeEmailSubject(code),
    email: <EmailChangeCodeEmail code={code} />,
    template: EmailTemplate.EmailChangeCode,
    idempotencyScope: requestId,
    userId,
  });
}

export async function sendEmailSubscriptionStarted(input: {
  to: EmailData;
  subscriptionId: string;
  userId: string;
}) {
  const { to, subscriptionId, userId } = input;

  await sendEmail({
    to,
    subject: subscriptionStartedEmailSubject(),
    email: <SubscriptionStartedEmail />,
    template: EmailTemplate.SubscriptionStarted,
    idempotencyScope: subscriptionId,
    userId,
  });
}

export async function sendEmailSubscriptionPaymentFailed(input: {
  to: EmailData;
  subscriptionId: string;
  billingPeriod: string;
  userId: string;
}) {
  const { to, subscriptionId, billingPeriod, userId } = input;

  await sendEmail({
    to,
    subject: subscriptionPaymentFailedEmailSubject(),
    email: (
      <SubscriptionPaymentFailedEmail
        portalUrl={`${config.appUrl}${href('/billing-portal')}`}
      />
    ),
    template: EmailTemplate.SubscriptionPaymentFailed,
    idempotencyScope: `${subscriptionId}:${billingPeriod}`,
    userId,
  });
}

export async function sendEmailSubscriptionCanceled(input: {
  to: EmailData;
  subscriptionId: string;
  userId: string;
}) {
  const { to, subscriptionId, userId } = input;

  await sendEmail({
    to,
    subject: subscriptionCanceledEmailSubject(),
    email: (
      <SubscriptionCanceledEmail
        upgradeUrl={`${config.appUrl}${href('/upgrade')}`}
      />
    ),
    template: EmailTemplate.SubscriptionCanceled,
    idempotencyScope: subscriptionId,
    userId,
  });
}
