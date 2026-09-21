import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import {
  DocumentInviteEmail,
  documentInviteEmailSubject,
  type DocumentInviteEmailProps,
} from './document-invite';

const documentUrl = 'https://pencilcase.app/doc/doc-id';

const props: DocumentInviteEmailProps = {
  inviterName: 'Alex',
  documentTitle: 'Trip to the Alps',
  documentUrl,
};

describe('documentInviteEmailSubject', () => {
  it('names who shared what, so the invite is recognisable in the inbox',
    () => {
      expect(documentInviteEmailSubject({
        inviterName: 'Alex',
        documentTitle: 'Trip to the Alps',
      })).toBe('Alex shared "Trip to the Alps" with you');
    });

  it('falls back to Untitled for a document with no heading yet', () => {
    expect(documentInviteEmailSubject({
      inviterName: 'Alex',
      documentTitle: null,
    })).toBe('Alex shared "Untitled" with you');
  });
});

describe('DocumentInviteEmail', () => {
  it('links to the document, which is what accepting the invite is',
    async () => {
      const html = await render(<DocumentInviteEmail {...props} />);

      expect(html).toContain(`href="${documentUrl}"`);
    });

  it('names the document and who shared it', async () => {
    const text = await render(<DocumentInviteEmail {...props} />, {
      plainText: true,
    });

    expect(text).toContain('Alex shared the document "Trip to the Alps"');
  });

  it('says which address to sign in with, since that is the account the '
    + 'document is shared with', async () => {
    const text = await render(<DocumentInviteEmail {...props} />, {
      plainText: true,
    });

    expect(text).toMatch(/sign in with this email address/i);
  });

  it('falls back to Untitled in the body as well', async () => {
    const text = await render(
      <DocumentInviteEmail {...props} documentTitle={null} />,
      { plainText: true },
    );

    expect(text).toContain('"Untitled"');
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(<DocumentInviteEmail {...props} />);

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('breaks the headline onto two lines', async () => {
    const html = await render(<DocumentInviteEmail {...props} />);

    expect(html).toContain('You&#x27;ve Been<br/>Invited');
  });

  it('matches the rendered markup', async () => {
    const html = await render(<DocumentInviteEmail {...props} />, {
      pretty: true,
    });

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(<DocumentInviteEmail {...props} />, {
      plainText: true,
    });

    expect(text).toMatchSnapshot();
  });
});
