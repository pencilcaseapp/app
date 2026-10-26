import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import {
  SupportRequestEmail,
  supportRequestEmailSubject,
  type SupportRequestEmailProps,
} from './support-request';

const props: SupportRequestEmailProps = {
  message: 'Images I paste don’t show up.',
  senderEmail: 'sam@example.com',
  url: 'https://docs.pencilcase.app/doc/doc-id/settings/support',
  userAgent: 'Mozilla/5.0 (Macintosh) Safari/605.1.15',
  userId: 'user-id',
};

describe('supportRequestEmailSubject', () => {
  it('names the sender', () => {
    expect(supportRequestEmailSubject('sam@example.com'))
      .toBe('Support request from sam@example.com');
  });
});

describe('SupportRequestEmail', () => {
  it('carries the message, the sender, the page and the browser',
    async () => {
      const text = await render(<SupportRequestEmail {...props} />, {
        plainText: true,
      });

      expect(text).toContain('Images I paste don’t show up.');
      expect(text).toContain('sam@example.com');
      expect(text).toContain(props.url);
      expect(text).toContain(props.userAgent);
      expect(text).toContain('user-id');
    });

  it('marks a missing page and user agent', async () => {
    const text = await render(
      <SupportRequestEmail {...props} url="" userAgent="" />,
      { plainText: true },
    );

    expect(text.match(/—/g)).toHaveLength(2);
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(<SupportRequestEmail {...props} />);

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('matches the rendered markup', async () => {
    const html = await render(<SupportRequestEmail {...props} />, {
      pretty: true,
    });

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(<SupportRequestEmail {...props} />, {
      plainText: true,
    });

    expect(text).toMatchSnapshot();
  });
});
