import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import {
  DocumentReportEmail,
  documentReportEmailSubject,
  type DocumentReportEmailProps,
} from './document-report';

const documentUrl = 'https://docs.pencilcase.app/doc/doc-id';

const props: DocumentReportEmailProps = {
  reportId: 'report-id',
  reason: 'harassment',
  details: 'Insults a colleague by name.',
  documentTitle: 'Trip to the Alps',
  documentUrl,
  ownerEmail: 'alex@example.com',
  reporterEmail: 'sam@example.com',
};

describe('documentReportEmailSubject', () => {
  it('names the document and the reason', () => {
    expect(documentReportEmailSubject({
      reason: 'spam',
      documentTitle: 'Trip to the Alps',
    })).toBe('Report: "Trip to the Alps" (Spam or scam)');
  });

  it('falls back to Untitled for a document with no heading yet', () => {
    expect(documentReportEmailSubject({
      reason: 'other',
      documentTitle: null,
    })).toBe('Report: "Untitled" (Something else)');
  });
});

describe('DocumentReportEmail', () => {
  it('says why, what and who', async () => {
    const text = await render(<DocumentReportEmail {...props} />, {
      plainText: true,
    });

    expect(text).toContain('Harassment or hate');
    expect(text).toContain(documentUrl);
    expect(text).toContain('Insults a colleague by name.');
    expect(text).toContain('Trip to the Alps');
    expect(text).toContain('alex@example.com');
    expect(text).toContain('sam@example.com');
    expect(text).toContain('report-id');
  });

  it('marks a report without details', async () => {
    const text = await render(
      <DocumentReportEmail {...props} details={null} />,
      { plainText: true },
    );

    expect(text).toContain('—');
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(<DocumentReportEmail {...props} />);

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('matches the rendered markup', async () => {
    const html = await render(<DocumentReportEmail {...props} />, {
      pretty: true,
    });

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(<DocumentReportEmail {...props} />, {
      plainText: true,
    });

    expect(text).toMatchSnapshot();
  });
});
