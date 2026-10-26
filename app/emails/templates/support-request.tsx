import { Layout } from '../ui/layout/layout';
import { Typography } from '../ui/typography/typography';

export interface SupportRequestEmailProps {
  message: string;
  senderEmail: string;
  url: string;
  userAgent: string;
  userId: string;
}

export function supportRequestEmailSubject(senderEmail: string) {
  return `Support request from ${senderEmail}`;
}

/*
 * Goes to our own inbox, not to a user: somebody wrote us through the
 * contact form in the settings. It carries the page they were on and their
 * browser, and replies go to whoever wrote.
 */
export function SupportRequestEmail({
  message,
  senderEmail,
  url,
  userAgent,
  userId,
}: SupportRequestEmailProps) {
  const rows = [
    ['Message', message],
    ['From', senderEmail],
    ['Page', url || '—'],
    ['User agent', userAgent || '—'],
    ['User ID', userId],
  ];

  return (
    <Layout preview={`Support request from ${senderEmail}`}>
      <Typography
        variant="heading2"
        as="h1"
        textAlign="center"
        className="mb-6"
      >
        Support Request
      </Typography>
      {rows.map(([label, value]) => (
        <div key={label} className="mb-4">
          <Typography variant="bodyTiny" textColor="grey-600">
            {label}
          </Typography>
          <Typography variant="bodySmall" className="whitespace-pre-wrap">
            {value}
          </Typography>
        </div>
      ))}
    </Layout>
  );
}

SupportRequestEmail.PreviewProps = {
  message: 'Images I paste from my phone don’t show up for my colleague.',
  senderEmail: 'sam@example.com',
  url: 'https://docs.pencilcase.app/doc/'
    + '2f4c9b1e-0c3a-4f2b-9c7e-1a2b3c4d5e6f/settings/support',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
    + 'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  userId: '8d1f3a6c-5b2e-4c7d-9a0f-3e4b5c6d7e8f',
} satisfies SupportRequestEmailProps;

export default SupportRequestEmail;
