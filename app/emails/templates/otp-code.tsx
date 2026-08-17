import { Layout } from '../ui/layout/layout';
import { OneTimeCode } from '../ui/one-time-code/one-time-code';
import { Typography } from '../ui/typography/typography';

const expiryMinutes = 15;

const body = `This code expires after ${expiryMinutes} minutes. Use this code `
  + 'to verify your email address with your pencil case account. Booyah!';

export interface OtpCodeEmailProps {
  code: string;
}

export function otpCodeEmailSubject(code: string) {
  return `Verification Code: ${code} – pencil case`;
}

export function OtpCodeEmail({ code }: OtpCodeEmailProps) {
  return (
    <Layout preview={`Your verification code is ${code}`}>
      <Typography variant="heading2" as="h1" textAlign="center" className="mb-3">
        One-Time Verification Code
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

OtpCodeEmail.PreviewProps = { code: '396921' } satisfies OtpCodeEmailProps;

export default OtpCodeEmail;
