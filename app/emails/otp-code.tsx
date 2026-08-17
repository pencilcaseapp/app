import { EmailCode } from './_components/email-code/email-code';
import { EmailHeading } from './_components/email-heading/email-heading';
import { EmailLayout } from './_components/email-layout/email-layout';
import { EmailText } from './_components/email-text/email-text';

/** Matches the `expires_at` default on `otps` in `app/db/schema.ts`. */
const expiryMinutes = 15;

const body = `This code expires after ${expiryMinutes} minutes. Use this code `
  + 'to verify your email address with your pencil case account. Booyah!';

export type OtpCodeEmailProps = {
  code: string;
};

/**
 * The subject travels with the template because it carries the code: that is
 * what lets iOS offer the code straight from the notification.
 */
export function otpCodeEmailSubject(code: string) {
  return `Verification Code: ${code} – pencil case`;
}

/**
 * Every string here is load bearing for the iOS keyboard, which only suggests a
 * code when it can pair a word like "code" with a nearby run of digits. Read
 * `docs/emails.md` before rewording any of it.
 */
export function OtpCodeEmail({ code }: OtpCodeEmailProps) {
  return (
    <EmailLayout preview={`Your verification code is ${code}`}>
      <EmailHeading>One-Time Verification Code</EmailHeading>
      <EmailText style={{ margin: '0 0 24px' }}>{body}</EmailText>
      <EmailText emphasis>Verification Code:</EmailText>
      <EmailCode code={code} />
    </EmailLayout>
  );
}

OtpCodeEmail.PreviewProps = { code: '396921' } satisfies OtpCodeEmailProps;

export default OtpCodeEmail;
