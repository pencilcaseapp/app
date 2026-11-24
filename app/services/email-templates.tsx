import { href } from 'react-router';
import { getConfig } from '~/config';
import {
  AccountDeletedEmail,
  accountDeletedEmailSubject,
} from '~/emails/templates/account-deleted';
import {
  ContactMessageEmail,
  contactMessageEmailSubject,
} from '~/emails/templates/contact-message';
import {
  ContractNoticeEmail,
  contractNoticeEmailSubject,
} from '~/emails/templates/contract-notice';
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
import { commonCopies } from '~/constants/common-copies';
import type { ContractNotice } from '~/constants/contract-notice';
import type { DocumentReportReason } from '~/constants/document';
import { EmailTemplate } from '~/constants/email';
import { SearchParamAuth } from '~/constants/search-params';
import { formatLongDate, toDateParam } from '~/utils/date';
import { withSearchParams } from '~/utils/url';
import { enqueueJob } from '~/jobs/queue';
import {
  logQueuedEmail,
  sendEmail,
  type EmailData,
  type SendEmailInput,
} from './email';

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

type SubscriptionStartedInput = {
  to: EmailData;
  subscriptionId: string;
  userId: string;
};

function subscriptionStartedEmail(
  input: SubscriptionStartedInput,
): SendEmailInput {
  const { to, subscriptionId, userId } = input;

  return {
    to,
    subject: subscriptionStartedEmailSubject(),
    email: <SubscriptionStartedEmail />,
    template: EmailTemplate.SubscriptionStarted,
    idempotencyScope: subscriptionId,
    userId,
  };
}

type SubscriptionPaymentFailedInput = {
  to: EmailData;
  subscriptionId: string;
  billingPeriod: string;
  userId: string;
};

function subscriptionPaymentFailedEmail(
  input: SubscriptionPaymentFailedInput,
): SendEmailInput {
  const { to, subscriptionId, billingPeriod, userId } = input;

  return {
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
  };
}

type SubscriptionCanceledInput = {
  to: EmailData;
  subscriptionId: string;
  userId: string;
};

function subscriptionCanceledEmail(
  input: SubscriptionCanceledInput,
): SendEmailInput {
  const { to, subscriptionId, userId } = input;

  return {
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
  };
}

/**
 * Invites somebody to a document. The link in the e-mail is the access and
 * there is no acceptance step, so what the recipient may do with it is
 * whatever the document's link access allows when they open it.
 * `inviterId` goes on the log row because the recipient need not have an
 * account yet, and the invite is the inviter's doing.
 */
type DocumentInviteInput = {
  to: EmailData;
  inviteId: string;
  documentId: string;
  documentTitle: string | null;
  inviterName: string;
  inviterId: string;
};

function documentInviteEmail(input: DocumentInviteInput): SendEmailInput {
  const {
    to,
    inviteId,
    documentId,
    documentTitle,
    inviterName,
    inviterId,
  } = input;

  return {
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
  };
}

/**
 * Somebody reported a document they can open but do not own. It goes to
 * our own inbox with the reporter as the reply-to address, so answering
 * them is a reply. Logged against the reporter, whose reports are capped.
 */
type DocumentReportInput = {
  reportId: string;
  reason: DocumentReportReason;
  details: string | null;
  documentId: string;
  documentTitle: string | null;
  ownerEmail: string;
  reporter: { id: string; email: string };
};

function documentReportEmail(input: DocumentReportInput): SendEmailInput {
  const {
    reportId,
    reason,
    details,
    documentId,
    documentTitle,
    ownerEmail,
    reporter,
  } = input;

  return {
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
  };
}

type ContactMessageInput = {
  messageId: string;
  email: string;
  message: string;
};

function contactMessageEmail(input: ContactMessageInput): SendEmailInput {
  const { messageId, email, message } = input;

  return {
    to: { email: commonCopies.supportEmail },
    replyTo: email,
    subject: contactMessageEmailSubject(email),
    email: <ContactMessageEmail email={email} message={message} />,
    template: EmailTemplate.ContactMessage,
    idempotencyScope: messageId,
  };
}

type ContractNoticeInput = {
  noticeId: string;
  notice: ContractNotice;
  /** An ISO date, the input goes through the job queue as JSON. */
  receivedAt: string;
  recipient: 'customer' | 'inbox';
};

/**
 * Confirms a cancellation or withdrawal to the customer, or hands our
 * inbox a copy to act on, answerable to the customer.
 */
function contractNoticeEmail(input: ContractNoticeInput): SendEmailInput {
  const { noticeId, notice, receivedAt, recipient } = input;
  const toCustomer = recipient === 'customer';

  return {
    to: { email: toCustomer ? notice.email : commonCopies.supportEmail },
    replyTo: toCustomer ? commonCopies.supportEmail : notice.email,
    subject: contractNoticeEmailSubject(notice, recipient),
    email: (
      <ContractNoticeEmail notice={notice} receivedAt={new Date(receivedAt)} />
    ),
    template: EmailTemplate.ContractNotice,
    idempotencyScope: `${noticeId}:${recipient}`,
  };
}

/**
 * Confirms the deletion of an account and says until when signing in
 * again restores it.
 */
export async function sendEmailAccountDeleted(input: {
  to: EmailData;
  userId: string;
  deletedAt: Date;
  restoreUntil: Date;
}) {
  const { to, userId, deletedAt, restoreUntil } = input;
  const signInUrl = withSearchParams(href('/signin'), {
    [SearchParamAuth.RestoreUntil]: toDateParam(restoreUntil),
  });

  await sendEmail({
    to,
    subject: accountDeletedEmailSubject(),
    email: (
      <AccountDeletedEmail
        restoreUntil={formatLongDate(restoreUntil)}
        signInUrl={`${config.appUrl}${signInUrl}`}
      />
    ),
    template: EmailTemplate.AccountDeleted,
    idempotencyScope: `${userId}:${deletedAt.toISOString()}`,
    userId,
  });
}

type QueuedEmailInputs = {
  [EmailTemplate.SubscriptionStarted]: SubscriptionStartedInput;
  [EmailTemplate.SubscriptionPaymentFailed]: SubscriptionPaymentFailedInput;
  [EmailTemplate.SubscriptionCanceled]: SubscriptionCanceledInput;
  [EmailTemplate.DocumentInvite]: DocumentInviteInput;
  [EmailTemplate.DocumentReport]: DocumentReportInput;
  [EmailTemplate.ContactMessage]: ContactMessageInput;
  [EmailTemplate.ContractNotice]: ContractNoticeInput;
};

type QueuedEmailTemplate = keyof QueuedEmailInputs;

/**
 * An e-mail nobody waits on, sent by the `send-email` job. The input goes
 * through Redis, so it stays JSON.
 */
export type QueuedEmail = {
  [Template in QueuedEmailTemplate]: {
    template: Template;
    input: QueuedEmailInputs[Template];
  };
}[QueuedEmailTemplate];

const queuedEmails: {
  [Template in QueuedEmailTemplate]:
  (input: QueuedEmailInputs[Template]) => SendEmailInput;
} = {
  [EmailTemplate.SubscriptionStarted]: subscriptionStartedEmail,
  [EmailTemplate.SubscriptionPaymentFailed]: subscriptionPaymentFailedEmail,
  [EmailTemplate.SubscriptionCanceled]: subscriptionCanceledEmail,
  [EmailTemplate.DocumentInvite]: documentInviteEmail,
  [EmailTemplate.DocumentReport]: documentReportEmail,
  [EmailTemplate.ContactMessage]: contactMessageEmail,
  [EmailTemplate.ContractNotice]: contractNoticeEmail,
};

export function buildQueuedEmail({ template, input }: QueuedEmail) {
  const build = queuedEmails[template] as (
    input: QueuedEmail['input'],
  ) => SendEmailInput;

  return build(input);
}

/**
 * Hands an e-mail to the background job instead of sending it in the
 * request, so a mail provider that is down only delays it. It is logged
 * as queued right away, which is what the invite limit counts.
 */
export async function queueEmail(queued: QueuedEmail) {
  await logQueuedEmail(buildQueuedEmail(queued));
  await enqueueJob('send-email', queued);
}

/** Sends a queued e-mail. Throws when the send fails, so the job retries. */
export async function sendQueuedEmail(queued: QueuedEmail) {
  await sendEmail(buildQueuedEmail(queued));
}
