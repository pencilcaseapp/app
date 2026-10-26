import {
  documentReportReasonLabels,
  type DocumentReportReason,
} from '../../constants/document';
import { Layout } from '../ui/layout/layout';
import { Typography } from '../ui/typography/typography';

const untitledDocument = 'Untitled';

const previewUrl = 'https://docs.pencilcase.app/doc/'
  + '2f4c9b1e-0c3a-4f2b-9c7e-1a2b3c4d5e6f';

export interface DocumentReportEmailProps {
  reportId: string;
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
  reportId,
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
    ['Report ID', reportId],
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
    </Layout>
  );
}

DocumentReportEmail.PreviewProps = {
  reportId: '8d1f3a6c-5b2e-4c7d-9a0f-3e4b5c6d7e8f',
  reason: 'harassment',
  details: 'The second paragraph insults a colleague of mine by name.',
  documentTitle: 'Trip to the Alps',
  documentUrl: previewUrl,
  ownerEmail: 'alex@example.com',
  reporterEmail: 'sam@example.com',
} satisfies DocumentReportEmailProps;

export default DocumentReportEmail;
