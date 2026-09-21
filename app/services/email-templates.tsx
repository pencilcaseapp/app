import { href } from 'react-router';
import { getConfig } from '~/config';
import {
  DocumentInviteEmail,
  documentInviteEmailSubject,
} from '~/emails/templates/document-invite';
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

/**
 * Invites somebody to a document. The link in the e-mail is the access and
 * there is no acceptance step, so what the recipient may do with it is
 * whatever the document's link access allows when they open it.
 * `inviterId` goes on the log row because the recipient need not have an
 * account yet, and the invite is the inviter's doing.
 */
export async function sendEmailDocumentInvite(input: {
  to: EmailData;
  inviteId: string;
  documentId: string;
  documentTitle: string | null;
  inviterName: string;
  inviterId: string;
}) {
  const {
    to,
    inviteId,
    documentId,
    documentTitle,
    inviterName,
    inviterId,
  } = input;

  await sendEmail({
    to,
    subject: documentInviteEmailSubject({ inviterName, documentTitle }),
    email: (
      <DocumentInviteEmail
        inviterName={inviterName}
        documentTitle={documentTitle}
        documentUrl={`${config.appUrl}${href('/doc/:id', { id: documentId })}`}
      />
    ),
    template: EmailTemplate.DocumentInvite,
    idempotencyScope: inviteId,
    userId: inviterId,
  });
}
