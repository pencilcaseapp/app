import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import {
  ContactMessageEmail,
  contactMessageEmailSubject,
  type ContactMessageEmailProps,
} from './contact-message';

const props: ContactMessageEmailProps = {
  email: 'sam@example.com',
  message: 'Can I export a document as PDF?',
};

describe('contactMessageEmailSubject', () => {
  it('names the sender', () => {
    expect(contactMessageEmailSubject('sam@example.com'))
      .toBe('Contact form: sam@example.com');
  });
});

describe('ContactMessageEmail', () => {
  it('carries the sender and the message', async () => {
    const text = await render(<ContactMessageEmail {...props} />, {
      plainText: true,
    });

    expect(text).toContain('sam@example.com');
    expect(text).toContain('Can I export a document as PDF?');
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(<ContactMessageEmail {...props} />);

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('matches the rendered markup', async () => {
    const html = await render(<ContactMessageEmail {...props} />, {
      pretty: true,
    });

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(<ContactMessageEmail {...props} />, {
      plainText: true,
    });

    expect(text).toMatchSnapshot();
  });
});
