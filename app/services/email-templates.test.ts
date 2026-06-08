import { describe, it, expect, vi } from 'vitest';
import { sendEmailMagicCode } from './email-templates';

const sendEMailMock = vi.fn();
vi.mock('./email', () => ({
  sendEmail: (...args: unknown[]) => sendEMailMock(...args),
}));

describe('sendEmailMagicCode', () => {
  it('should send an email with the correct subject and HTML content', async () => {
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
      subject: 'Your Magic Sign-In Code',
      html: `<p>Use the following code to sign in:</p><h2>123456</h2>`,
    });
  });
});
