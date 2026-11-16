import { Layout } from '../ui/layout/layout';
import { Typography } from '../ui/typography/typography';

export interface ContactMessageEmailProps {
  email: string;
  message: string;
}

export function contactMessageEmailSubject(email: string) {
  return `Contact form: ${email}`;
}

/*
 * Goes to our own inbox, not to a user: somebody wrote to us through the
 * website's contact form. Replies go to the address they gave.
 */
export function ContactMessageEmail({
  email,
  message,
}: ContactMessageEmailProps) {
  const rows = [
    ['From', email],
    ['Message', message],
  ];

  return (
    <Layout preview={`${email}: ${message.slice(0, 80)}`}>
      <Typography
        variant="heading2"
        as="h1"
        textAlign="center"
        className="mb-6"
      >
        Contact Form
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

ContactMessageEmail.PreviewProps = {
  email: 'sam@example.com',
  message: 'Hi there,\n\nCan I export a document as PDF?\n\nSam',
} satisfies ContactMessageEmailProps;

export default ContactMessageEmail;
