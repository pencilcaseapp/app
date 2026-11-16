import type { ContractNotice } from '../../constants/contract-notice';
import { Layout } from '../ui/layout/layout';
import { Typography } from '../ui/typography/typography';

const receivedFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Europe/Berlin',
  timeZoneName: 'short',
});

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

const copies = {
  cancellation: {
    heading: 'Cancellation Received',
    statement: 'I cancel my contract for pencil case Pro.',
    body: 'We received your cancellation of pencil case Pro. Below is what '
      + 'you sent us and when it reached us. We’ll take care of it and '
      + 'write to you once it’s done.',
  },
  withdrawal: {
    heading: 'Withdrawal Received',
    statement: 'I withdraw from my contract for pencil case Pro.',
    body: 'We received your withdrawal from your pencil case Pro contract. '
      + 'Below is what you sent us and when it reached us. We’ll refund '
      + 'your payment within 14 days and write to you once it’s done.',
  },
};

const cancellationTypeLabels = {
  ordinary: 'Ordinary, with notice',
  extraordinary: 'Extraordinary, for good cause',
};

export interface ContractNoticeEmailProps {
  notice: ContractNotice;
  receivedAt: Date;
}

/** The inbox's copy says who sent it, the customer's what they sent. */
export function contractNoticeEmailSubject(
  notice: ContractNotice,
  recipient: 'customer' | 'inbox',
) {
  if (recipient === 'inbox') {
    const kind = notice.kind === 'cancellation'
      ? 'Cancellation'
      : 'Withdrawal';

    return `${kind}: ${notice.email}`;
  }

  return `We received your ${notice.kind}`;
}

function getRows(notice: ContractNotice) {
  if (notice.kind === 'withdrawal') {
    return [];
  }

  const ends = notice.endsOn
    ? dayFormat.format(new Date(`${notice.endsOn}T00:00:00Z`))
    : 'At the earliest possible date';

  return [
    ['Type', cancellationTypeLabels[notice.cancellationType]],
    ...(notice.reason ? [['Reason', notice.reason]] : []),
    ['Ends', ends],
  ];
}

/*
 * The confirmation on a durable medium both laws ask for: the content of
 * the cancellation or withdrawal and the date and time it reached us. The
 * customer gets it, and our inbox a copy to act on.
 */
export function ContractNoticeEmail({
  notice,
  receivedAt,
}: ContractNoticeEmailProps) {
  const copy = copies[notice.kind];
  const rows = [
    ['Statement', copy.statement],
    ...getRows(notice),
    ['Name', notice.name],
    ['E-mail address', notice.email],
    ['Received', receivedFormat.format(receivedAt)],
  ];

  return (
    <Layout preview={copy.body}>
      <Typography
        variant="heading2"
        as="h1"
        textAlign="center"
        className="mb-3"
      >
        {copy.heading}
      </Typography>
      <Typography variant="bodySmall" textAlign="center" className="mb-6">
        {copy.body}
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

ContractNoticeEmail.PreviewProps = {
  notice: {
    kind: 'cancellation',
    name: 'Sam Doe',
    email: 'sam@example.com',
    cancellationType: 'ordinary',
    reason: null,
    endsOn: null,
  },
  receivedAt: new Date('2026-11-16T13:56:42Z'),
} satisfies ContractNoticeEmailProps;

export default ContractNoticeEmail;
