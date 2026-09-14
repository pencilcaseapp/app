import { Layout } from '../ui/layout/layout';
import { OneTimeCode } from '../ui/one-time-code/one-time-code';
import { Typography } from '../ui/typography/typography';

const expiryMinutes = 15;

const body = `This code expires after ${expiryMinutes} minutes. Use this code `
  + 'to confirm the new e-mail address of your pencil case account. '
  + 'If you did not ask for this change, you can ignore this email.';

export interface EmailChangeCodeEmailProps {
  code: string;
}

const preview = `Use it within ${expiryMinutes} minutes to confirm your new `
  + 'e-mail address.';

export function emailChangeCodeEmailSubject(code: string) {
  return `Verification Code: ${code}`;
}

/*
 * The counterpart of `OtpCodeEmail` for a change of address, sent to the
 * new address. It follows the same copy rules (see docs/emails.md), so
 * iOS offers the code to the keyboard here too.
 */
export function EmailChangeCodeEmail({ code }: EmailChangeCodeEmailProps) {
  return (
    <Layout preview={preview}>
      <Typography variant="heading2" as="h1" textAlign="center" className="mb-3">
        Confirm Your
        <br />
        New E-Mail Address
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-6">
        {body}
      </Typography>
      <Typography
        variant="bodySmall"
        fontWeight="semibold"
        textAlign="center"
        className="mb-3"
      >
        Verification Code:
      </Typography>
      <OneTimeCode code={code} />
    </Layout>
  );
}

EmailChangeCodeEmail.PreviewProps = {
  code: '396921',
} satisfies EmailChangeCodeEmailProps;

export default EmailChangeCodeEmail;
