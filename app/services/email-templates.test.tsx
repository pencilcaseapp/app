import { render } from 'react-email';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
  documentInviteEmailSubject,
} from '~/emails/templates/document-invite';
import { emailChangeCodeEmailSubject } from '~/emails/templates/email-change-code';
import { otpCodeEmailSubject } from '~/emails/templates/otp-code';
import { EmailTemplate } from '~/constants/email';
import {
  sendEmailChangeCode,
  sendEmailDocumentInvite,
  sendEmailMagicCode,
  sendEmailSubscriptionPaymentFailed,
} from './email-templates';

const sendEMailMock = vi.fn();
vi.mock('./email', () => ({
  sendEmail: (...args: unknown[]) => sendEMailMock(...args),
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

describe('sendEmailSubscriptionPaymentFailed', () => {
  it('scopes the key to the billing period, so one failed payment is one '
    + 'e-mail however often Creem retries it', async () => {
    await sendEmailSubscriptionPaymentFailed({
      to: { email: 'test@example.com' },
      subscriptionId: 'sub_123',
      billingPeriod: '2026-08-01T00:00:00.000Z',
      userId: 'user-id',
    });

    expect(sendEMailMock).toHaveBeenCalledWith(expect.objectContaining({
      template: EmailTemplate.SubscriptionPaymentFailed,
      idempotencyScope: 'sub_123:2026-08-01T00:00:00.000Z',
    }));
  });
});

describe('sendEmailDocumentInvite', () => {
  const invite = {
    to: { email: 'friend@example.com' },
    inviteId: 'invite-id',
    documentId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    documentTitle: 'Trip to the Alps',
    inviterName: 'Alex',
    inviterId: 'user-id',
  };

  it('sends the invite template scoped to the invite, and logs it against '
    + 'the inviter rather than a recipient who may have no account',
  async () => {
    await sendEmailDocumentInvite(invite);

    expect(sendEMailMock).toHaveBeenCalledWith({
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
    await sendEmailDocumentInvite(invite);

    const [{ email }] = sendEMailMock.mock.calls[0];
    expect(await render(email, { plainText: true }))
      .toContain(`/doc/${invite.documentId}`);
  });
});
