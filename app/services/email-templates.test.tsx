import { render } from 'react-email';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
  documentInviteEmailSubject,
} from '~/emails/templates/document-invite';
import { emailChangeCodeEmailSubject } from '~/emails/templates/email-change-code';
import { otpCodeEmailSubject } from '~/emails/templates/otp-code';
import { EmailTemplate } from '~/constants/email';
import { documentReportEmailSubject } from '~/emails/templates/document-report';
import { contactMessageEmailSubject } from '~/emails/templates/contact-message';
import { accountDeletedEmailSubject } from '~/emails/templates/account-deleted';
import {
  buildQueuedEmail,
  queueEmail,
  sendEmailAccountDeleted,
  sendEmailChangeCode,
  sendEmailMagicCode,
  sendQueuedEmail,
} from './email-templates';

const sendEMailMock = vi.fn();
const logQueuedEmailMock = vi.fn();
vi.mock('./email', () => ({
  sendEmail: (...args: unknown[]) => sendEMailMock(...args),
  logQueuedEmail: (...args: unknown[]) => logQueuedEmailMock(...args),
}));

const enqueueJobMock = vi.fn();
vi.mock('~/jobs/queue', () => ({
  enqueueJob: (...args: unknown[]) => enqueueJobMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendEmailMagicCode', () => {
  it('sends the OTP template with the code in the subject', async () => {
    await sendEmailMagicCode({
      to: {
        email: 'test@example.com',
        name: 'Test User',
      },
      code: '123456',
      otpId: 'otp-id',
      userId: 'user-id',
    });

    expect(sendEMailMock).toHaveBeenCalledWith({
      to: {
        email: 'test@example.com',
        name: 'Test User',
      },
      subject: otpCodeEmailSubject('123456'),
      email: expect.anything(),
      template: EmailTemplate.OtpCode,
      idempotencyScope: 'otp-id',
      userId: 'user-id',
    });

    const [{ email }] = sendEMailMock.mock.calls[0];
    expect(await render(email, { plainText: true })).toContain('123456');
  });
});

describe('sendEmailChangeCode', () => {
  it('sends the change template with the code in the subject', async () => {
    await sendEmailChangeCode({
      to: {
        email: 'new@example.com',
      },
      code: '654321',
      requestId: 'request-id',
      userId: 'user-id',
    });

    expect(sendEMailMock).toHaveBeenCalledWith({
      to: {
        email: 'new@example.com',
      },
      subject: emailChangeCodeEmailSubject('654321'),
      email: expect.anything(),
      template: EmailTemplate.EmailChangeCode,
      idempotencyScope: 'request-id',
      userId: 'user-id',
    });

    const [{ email }] = sendEMailMock.mock.calls[0];
    expect(await render(email, { plainText: true })).toContain('654321');
  });
});

describe('queueEmail', () => {
  const queued = {
    template: EmailTemplate.ContactMessage,
    input: {
      messageId: 'message-id',
      email: 'sam@example.com',
      message: 'Hello',
    },
  } as const;

  it('logs the e-mail as queued and hands it to the job', async () => {
    await queueEmail(queued);

    expect(logQueuedEmailMock).toHaveBeenCalledWith(buildQueuedEmail(queued));
    expect(enqueueJobMock).toHaveBeenCalledWith('send-email', queued);
    expect(sendEMailMock).not.toHaveBeenCalled();
  });
});

describe('sendQueuedEmail', () => {
  it('sends the e-mail it is given', async () => {
    await sendQueuedEmail({
      template: EmailTemplate.ContactMessage,
      input: {
        messageId: 'message-id',
        email: 'sam@example.com',
        message: 'Hello',
      },
    });

    expect(sendEMailMock).toHaveBeenCalledWith(expect.objectContaining({
      template: EmailTemplate.ContactMessage,
      idempotencyScope: 'message-id',
    }));
  });
});

describe('subscription payment failed e-mail', () => {
  it('scopes the key to the billing period, so one failed payment is one '
    + 'e-mail however often Creem retries it', () => {
    const email = buildQueuedEmail({
      template: EmailTemplate.SubscriptionPaymentFailed,
      input: {
        to: { email: 'test@example.com' },
        subscriptionId: 'sub_123',
        billingPeriod: '2026-08-01T00:00:00.000Z',
        userId: 'user-id',
      },
    });

    expect(email).toMatchObject({
      template: EmailTemplate.SubscriptionPaymentFailed,
      idempotencyScope: 'sub_123:2026-08-01T00:00:00.000Z',
    });
  });
});

describe('document invite e-mail', () => {
  const invite = {
    to: { email: 'friend@example.com' },
    inviteId: 'invite-id',
    documentId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    documentTitle: 'Trip to the Alps',
    inviterName: 'Alex',
    inviterId: 'user-id',
  };

  function inviteEmail() {
    return buildQueuedEmail({
      template: EmailTemplate.DocumentInvite,
      input: invite,
    });
  }

  it('sends the invite template scoped to the invite, and logs it against '
    + 'the inviter rather than a recipient who may have no account', () => {
    expect(inviteEmail()).toStrictEqual({
      to: { email: 'friend@example.com' },
      subject: documentInviteEmailSubject({
        inviterName: 'Alex',
        documentTitle: 'Trip to the Alps',
      }),
      email: expect.anything(),
      template: EmailTemplate.DocumentInvite,
      idempotencyScope: 'invite-id',
      userId: 'user-id',
    });
  });

  it('links to the document the invite is for', async () => {
    const { email } = inviteEmail();
    expect(await render(email, { plainText: true }))
      .toContain(`/doc/${invite.documentId}`);
  });
});

describe('document report e-mail', () => {
  const report = {
    reportId: 'report-id',
    reason: 'spam' as const,
    details: 'Links to a fake shop.',
    documentId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    documentTitle: 'Trip to the Alps',
    ownerEmail: 'alex@example.com',
    reporter: { id: 'user-id', email: 'sam@example.com' },
  };

  function reportEmail() {
    return buildQueuedEmail({
      template: EmailTemplate.DocumentReport,
      input: report,
    });
  }

  it('sends the report to our inbox, answerable to the reporter and logged '
    + 'against them', () => {
    expect(reportEmail()).toStrictEqual({
      to: { email: 'inbox@pencilcase.app' },
      replyTo: 'sam@example.com',
      subject: documentReportEmailSubject({
        reason: 'spam',
        documentTitle: 'Trip to the Alps',
      }),
      email: expect.anything(),
      template: EmailTemplate.DocumentReport,
      idempotencyScope: 'report-id',
      userId: 'user-id',
    });
  });

  it('links to the reported document', async () => {
    const { email } = reportEmail();
    expect(await render(email, { plainText: true }))
      .toContain(`/doc/${report.documentId}`);
  });

  it('names the report row', async () => {
    const { email } = reportEmail();
    expect(await render(email, { plainText: true }))
      .toContain('report-id');
  });
});

describe('contact message e-mail', () => {
  it('sends the message to our inbox, answerable to the sender', () => {
    const email = buildQueuedEmail({
      template: EmailTemplate.ContactMessage,
      input: {
        messageId: 'message-id',
        email: 'sam@example.com',
        message: 'Hello',
      },
    });

    expect(email).toStrictEqual({
      to: { email: 'inbox@pencilcase.app' },
      replyTo: 'sam@example.com',
      subject: contactMessageEmailSubject('sam@example.com'),
      email: expect.anything(),
      template: EmailTemplate.ContactMessage,
      idempotencyScope: 'message-id',
    });
  });
});

describe('contract notice e-mail', () => {
  const input = {
    noticeId: 'notice-id',
    notice: {
      kind: 'withdrawal' as const,
      name: 'Sam Doe',
      email: 'sam@example.com',
    },
    receivedAt: '2026-11-16T13:56:42.000Z',
  };

  it('confirms it to the customer', () => {
    const email = buildQueuedEmail({
      template: EmailTemplate.ContractNotice,
      input: { ...input, recipient: 'customer' },
    });

    expect(email).toStrictEqual({
      to: { email: 'sam@example.com' },
      replyTo: 'inbox@pencilcase.app',
      subject: 'We received your withdrawal',
      email: expect.anything(),
      template: EmailTemplate.ContractNotice,
      idempotencyScope: 'notice-id:customer',
    });
  });

  it('copies our inbox, answerable to the customer', () => {
    const email = buildQueuedEmail({
      template: EmailTemplate.ContractNotice,
      input: { ...input, recipient: 'inbox' },
    });

    expect(email).toStrictEqual({
      to: { email: 'inbox@pencilcase.app' },
      replyTo: 'sam@example.com',
      subject: 'Withdrawal: sam@example.com',
      email: expect.anything(),
      template: EmailTemplate.ContractNotice,
      idempotencyScope: 'notice-id:inbox',
    });
  });
});

describe('sendEmailAccountDeleted', () => {
  it('scopes the key to the deletion, so a second deletion is mailed '
    + 'again', async () => {
    await sendEmailAccountDeleted({
      to: { email: 'test@example.com' },
      userId: 'user-id',
      deletedAt: new Date('2026-11-23T16:00:00.000Z'),
      restoreUntil: new Date('2026-12-23T16:00:00.000Z'),
    });

    expect(sendEMailMock).toHaveBeenCalledWith({
      to: { email: 'test@example.com' },
      subject: accountDeletedEmailSubject(),
      email: expect.anything(),
      template: EmailTemplate.AccountDeleted,
      idempotencyScope: 'user-id:2026-11-23T16:00:00.000Z',
      userId: 'user-id',
    });

    const [{ email }] = sendEMailMock.mock.calls[0];
    const text = await render(email, { plainText: true });
    expect(text).toContain('23 December 2026');
    expect(text).toContain('/signin?restoreUntil=2026-12-23');
  });
});
