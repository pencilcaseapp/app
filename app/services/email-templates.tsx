import { href } from 'react-router';
import { getConfig } from '~/config';
import {
  DocumentInviteEmail,
  documentInviteEmailSubject,
} from '~/emails/templates/document-invite';
import {
  DocumentReportEmail,
  documentReportEmailSubject,
} from '~/emails/templates/document-report';
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
import {
  SupportRequestEmail,
  supportRequestEmailSubject,
} from '~/emails/templates/support-request';
import { commonCopies } from '~/constants/common-copies';
import type { DocumentReportReason } from '~/constants/document';
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

/**
 * Somebody reported a document they can open but do not own. It goes to
 * our own inbox with the reporter as the reply-to address, so answering
 * them is a reply. Logged against the reporter, whose reports are capped.
 */
export async function sendEmailDocumentReport(input: {
  reportId: string;
  reason: DocumentReportReason;
  details: string | null;
  documentId: string;
  documentTitle: string | null;
  ownerEmail: string;
  reporter: { id: string; email: string };
}) {
  const {
    reportId,
    reason,
    details,
    documentId,
    documentTitle,
    ownerEmail,
    reporter,
  } = input;

  await sendEmail({
    to: { email: commonCopies.supportEmail },
    replyTo: reporter.email,
    subject: documentReportEmailSubject({ reason, documentTitle }),
    email: (
      <DocumentReportEmail
        reportId={reportId}
        reason={reason}
        details={details}
        documentTitle={documentTitle}
        documentUrl={`${config.appUrl}${href('/doc/:id', { id: documentId })}`}
        ownerEmail={ownerEmail}
        reporterEmail={reporter.email}
      />
    ),
    template: EmailTemplate.DocumentReport,
    idempotencyScope: reportId,
    userId: reporter.id,
  });
}

/**
 * Somebody wrote us through the contact form in the settings. It goes to
 * our own inbox with them as the reply-to address, so answering them is a
 * reply. Logged against the sender, whose messages are capped.
 */
export async function sendEmailSupportRequest(input: {
  requestId: string;
  message: string;
  url: string;
  userAgent: string;
  sender: { id: string; email: string };
}) {
  const { requestId, message, url, userAgent, sender } = input;

  await sendEmail({
    to: { email: commonCopies.supportEmail },
    replyTo: sender.email,
    subject: supportRequestEmailSubject(sender.email),
    email: (
      <SupportRequestEmail
        message={message}
        senderEmail={sender.email}
        url={url}
        userAgent={userAgent}
        userId={sender.id}
      />
    ),
    template: EmailTemplate.SupportRequest,
    idempotencyScope: requestId,
    userId: sender.id,
  });
}
