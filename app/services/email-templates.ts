import { sendEmail, type EmailData } from './email';

export async function sendEmailMagicCode(
  input: { to: EmailData; code: string },
) {
  const { to, code } = input;

  await sendEmail({
    to,
    subject: 'Your Magic Sign-In Code',
    html: `<p>Use the following code to sign in:</p><h2>${code}</h2>`,
  });
}
