import {
  documentReportReasonLabels,
  type DocumentReportReason,
} from '../../constants/document';
import { Layout } from '../ui/layout/layout';
import { LinkButton } from '../ui/link-button/link-button';
import { Typography } from '../ui/typography/typography';

const untitledDocument = 'Untitled';

const previewUrl = 'https://pencilcase.app/doc/'
  + '2f4c9b1e-0c3a-4f2b-9c7e-1a2b3c4d5e6f';

const closing = 'Reply to this email to answer the person who reported it. '
  + 'The stores expect a timely response.';

export interface DocumentReportEmailProps {
  reason: DocumentReportReason;
  details: string | null;
  documentTitle: string | null;
  documentUrl: string;
  ownerEmail: string;
  reporterEmail: string;
}

export function documentReportEmailSubject(input: {
  reason: DocumentReportReason;
  documentTitle: string | null;
}) {
  const title = input.documentTitle ?? untitledDocument;

  return `Report: "${title}" (${documentReportReasonLabels[input.reason]})`;
}

/*
 * Goes to our own inbox, not to a user: somebody reported a document they
 * can open but do not own. It carries everything needed to look into it,
 * and replies go to whoever reported it.
 */
export function DocumentReportEmail({
  reason,
  details,
  documentTitle,
  documentUrl,
  ownerEmail,
  reporterEmail,
}: DocumentReportEmailProps) {
  const rows = [
    ['Reason', documentReportReasonLabels[reason]],
    ['Details', details ?? '—'],
    ['Document', documentTitle ?? untitledDocument],
    ['Link', documentUrl],
    ['Owner', ownerEmail],
    ['Reported by', reporterEmail],
  ];

  return (
    <Layout preview={`${documentReportReasonLabels[reason]}: ${reporterEmail}`}>
      <Typography
        variant="heading2"
        as="h1"
        textAlign="center"
        className="mb-6"
      >
        Document Reported
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
      <LinkButton href={documentUrl} className="mt-2 mb-6">
        Open the document
      </LinkButton>
      <Typography variant="bodyTiny" textAlign="center" textColor="grey-600">
        {closing}
      </Typography>
    </Layout>
  );
}

DocumentReportEmail.PreviewProps = {
  reason: 'harassment',
  details: 'The second paragraph insults a colleague of mine by name.',
  documentTitle: 'Trip to the Alps',
  documentUrl: previewUrl,
  ownerEmail: 'alex@example.com',
  reporterEmail: 'sam@example.com',
} satisfies DocumentReportEmailProps;

export default DocumentReportEmail;
