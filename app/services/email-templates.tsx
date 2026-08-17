import { OtpCodeEmail, otpCodeEmailSubject } from '~/emails/otp-code';
import { sendEmail, type EmailData } from './email';

export async function sendEmailMagicCode(
  input: { to: EmailData; code: string },
) {
  const { to, code } = input;

  await sendEmail({
    to,
    subject: otpCodeEmailSubject(code),
    email: <OtpCodeEmail code={code} />,
  });
}
