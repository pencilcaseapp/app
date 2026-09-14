import { render } from 'react-email';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { emailChangeCodeEmailSubject } from '~/emails/templates/email-change-code';
import { otpCodeEmailSubject } from '~/emails/templates/otp-code';
import { sendEmailChangeCode, sendEmailMagicCode } from './email-templates';

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
    });

    expect(sendEMailMock).toHaveBeenCalledWith({
      to: {
        email: 'test@example.com',
        name: 'Test User',
      },
      subject: otpCodeEmailSubject('123456'),
      email: expect.anything(),
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
    });

    expect(sendEMailMock).toHaveBeenCalledWith({
      to: {
        email: 'new@example.com',
      },
      subject: emailChangeCodeEmailSubject('654321'),
      email: expect.anything(),
    });

    const [{ email }] = sendEMailMock.mock.calls[0];
    expect(await render(email, { plainText: true })).toContain('654321');
  });
});
