import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailTemplate } from '~/constants/email';
import { isTestEmailAddress, sendEmail } from './email';

const lettermintEmailMock = {
  idempotencyKey: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  subject: vi.fn().mockReturnThis(),
  html: vi.fn().mockReturnThis(),
  text: vi.fn().mockReturnThis(),
  send: vi.fn(),
};

vi.mock('lettermint', () => ({
  Lettermint: class {
    email = lettermintEmailMock;
  },
}));

const claimEmailLogMock = vi.fn();
const markEmailLogSentMock = vi.fn();
const markEmailLogSkippedMock = vi.fn();
const markEmailLogFailedMock = vi.fn();

vi.mock('~/repos/email-log', () => ({
  claimEmailLog: (...args: unknown[]) => claimEmailLogMock(...args),
  markEmailLogSent: (...args: unknown[]) => markEmailLogSentMock(...args),
  markEmailLogSkipped:
    (...args: unknown[]) => markEmailLogSkippedMock(...args),
  markEmailLogFailed:
    (...args: unknown[]) => markEmailLogFailedMock(...args),
}));

vi.mock('~/config', () => ({
  getConfig: () => ({
    email: {
      apiToken: 'test-api-token',
      from: {
        name: 'pencil case',
        email: 'inbox@pencilcaseapp.com',
      },
    },
  }),
}));

const log = { id: 'log-id' };

const input = {
  to: { email: 'john@doe.com' },
  subject: 'Test Email',
  email: <p>This is a test email.</p>,
  template: EmailTemplate.OtpCode,
  idempotencyScope: 'otp-id',
};

beforeEach(() => {
  claimEmailLogMock.mockResolvedValue(log);
  lettermintEmailMock.send.mockResolvedValue({ message_id: 'msg_123' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('sendEmail', () => {
  it('sends an email with formatted sender and recipient', async () => {
    await sendEmail({
      ...input,
      to: {
        name: 'John Doe',
        email: 'john@doe.com',
      },
    });

    expect(lettermintEmailMock.from).toHaveBeenCalledWith('pencil case <inbox@pencilcaseapp.com>');
    expect(lettermintEmailMock.to).toHaveBeenCalledWith('John Doe <john@doe.com>');
    expect(lettermintEmailMock.subject).toHaveBeenCalledWith('Test Email');
    expect(lettermintEmailMock.send).toHaveBeenCalledTimes(1);
  });

  it('renders the template to both an HTML and a plain text body', async () => {
    await sendEmail(input);

    const [html] = lettermintEmailMock.html.mock.calls[0];
    const [text] = lettermintEmailMock.text.mock.calls[0];

    expect(html).toContain('<p>This is a test email.</p>');
    expect(text).toBe('This is a test email.');
  });

  it('never hands a test address to Lettermint', async () => {
    await sendEmail({ ...input, to: { email: 'e2e-a-123@pencilcase.app' } });

    expect(lettermintEmailMock.send).not.toHaveBeenCalled();
    expect(markEmailLogSkippedMock).toHaveBeenCalledWith({
      id: log.id,
      reason: 'Test address',
    });
  });

  it('claims the key before it sends, and logs the provider message',
    async () => {
      await sendEmail({ ...input, userId: 'user-id' });

      expect(claimEmailLogMock).toHaveBeenCalledWith({
        idempotencyKey: 'otp-code:otp-id',
        template: EmailTemplate.OtpCode,
        email: 'john@doe.com',
        subject: 'Test Email',
        userId: 'user-id',
      });
      expect(markEmailLogSentMock).toHaveBeenCalledWith({
        id: log.id,
        providerMessageId: 'msg_123',
      });
    });

  it('hands the same key to Lettermint', async () => {
    await sendEmail(input);

    expect(lettermintEmailMock.idempotencyKey)
      .toHaveBeenCalledWith('otp-code:otp-id');
  });

  it('sends nothing when the key is already taken', async () => {
    claimEmailLogMock.mockResolvedValue(undefined);

    await sendEmail(input);

    expect(lettermintEmailMock.send).not.toHaveBeenCalled();
    expect(markEmailLogSentMock).not.toHaveBeenCalled();
  });

  it('records a failed send and rethrows', async () => {
    lettermintEmailMock.send.mockRejectedValue(new Error('Boom'));

    await expect(sendEmail(input)).rejects.toThrow('Boom');

    expect(markEmailLogFailedMock).toHaveBeenCalledWith({
      id: log.id,
      error: 'Boom',
    });
  });
});

describe('isTestEmailAddress', () => {
  it.each([
    'e2e-a-123@pencilcase.app',
    'E2E-B-456@PENCILCASE.APP',
    'john@example.com',
    'jane@example.org',
    'someone@sub.example',
    'dev@app.test',
    'dev@localhost.localhost',
  ])('treats %s as a test address', (email) => {
    expect(isTestEmailAddress(email)).toBe(true);
  });

  it.each([
    'john@doe.com',
    'e2e@pencilcase.app',
    'henrik@wakesys.com',
    'not-an-email',
  ])('treats %s as a real address', (email) => {
    expect(isTestEmailAddress(email)).toBe(false);
  });
});
