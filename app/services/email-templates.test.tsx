import { render } from 'react-email';
import { describe, it, expect, vi } from 'vitest';
import { otpCodeEmailSubject } from '~/emails/templates/otp-code';
import { sendEmailMagicCode } from './email-templates';

const sendEMailMock = vi.fn();
vi.mock('./email', () => ({
  sendEmail: (...args: unknown[]) => sendEMailMock(...args),
}));

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
