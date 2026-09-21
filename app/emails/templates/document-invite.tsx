import { Layout } from '../ui/layout/layout';
import { LinkButton } from '../ui/link-button/link-button';
import { Typography } from '../ui/typography/typography';

const untitledDocument = 'Untitled';

const preview = 'Open it in pencil case by signing in with this address.';

const signIn = 'Sign in with this email address to open it. We send a code '
  + 'to the same address, so there is no password to remember.';

const closing = 'The link opens this one document and nothing else. If you '
  + 'were not expecting it, you can ignore this email.';

const previewUrl = 'https://pencilcase.app/doc/'
  + '2f4c9b1e-0c3a-4f2b-9c7e-1a2b3c4d5e6f';

export interface DocumentInviteEmailProps {
  inviterName: string;
  documentTitle: string | null;
  documentUrl: string;
}

export function documentInviteEmailSubject(input: {
  inviterName: string;
  documentTitle: string | null;
}) {
  const title = input.documentTitle ?? untitledDocument;

  return `${input.inviterName} shared "${title}" with you`;
}

/*
 * The invitation itself: there is no separate acceptance step, because the
 * link is the access. Opening it connects the recipient as a collaborator,
 * so the document shows up in their navigation from then on.
 */
export function DocumentInviteEmail({
  inviterName,
  documentTitle,
  documentUrl,
}: DocumentInviteEmailProps) {
  const title = documentTitle ?? untitledDocument;
  const opening = `${inviterName} shared the document "${title}" `
    + 'with you in pencil case.';

  return (
    <Layout preview={preview}>
      <Typography
        variant="heading2"
        as="h1"
        textAlign="center"
        className="mb-3"
      >
        You&apos;ve Been
        <br />
        Invited
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-3">
        {opening}
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-6">
        {signIn}
      </Typography>
      <LinkButton href={documentUrl} className="mb-6">
        Open the document
      </LinkButton>
      <Typography variant="bodyTiny" textAlign="center" textColor="grey-600">
        {closing}
      </Typography>
    </Layout>
  );
}

DocumentInviteEmail.PreviewProps = {
  inviterName: 'Alex',
  documentTitle: 'Trip to the Alps',
  documentUrl: previewUrl,
} satisfies DocumentInviteEmailProps;

export default DocumentInviteEmail;
