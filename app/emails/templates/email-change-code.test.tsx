import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import {
  EmailChangeCodeEmail,
  emailChangeCodeEmailSubject,
} from './email-change-code';

const code = '396921';

describe('emailChangeCodeEmailSubject', () => {
  it('carries the code so iOS can offer it from the notification', () => {
    expect(emailChangeCodeEmailSubject(code)).toContain(code);
  });
});

describe('EmailChangeCodeEmail', () => {
  it('keeps the code a single unbroken run of digits', async () => {
    const html = await render(<EmailChangeCodeEmail code={code} />);

    expect(html).toMatch(new RegExp(`>${code}<`));
  });

  it('pairs the word "code" with the digits in the plain text body', async () => {
    const text = await render(<EmailChangeCodeEmail code={code} />, {
      plainText: true,
    });

    expect(text).toMatch(new RegExp(`code[^0-9]*${code}`, 'i'));
  });

  it('is the only code-shaped number in the message', async () => {
    const text = await render(<EmailChangeCodeEmail code={code} />, {
      plainText: true,
    });

    expect(text.match(/\d{4,8}/g)).toEqual([code]);
  });

  it('leaves the code out of the preheader', async () => {
    const html = await render(<EmailChangeCodeEmail code={code} />);
    const preheader = html.match(/data-skip-in-text="true">([^<]*)/)?.[1];

    expect(preheader?.trim()).toBe(
      'Use it within 15 minutes to confirm your new e-mail address.',
    );
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(<EmailChangeCodeEmail code={code} />);

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('matches the rendered markup', async () => {
    const html = await render(<EmailChangeCodeEmail code={code} />, {
      pretty: true,
    });

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(<EmailChangeCodeEmail code={code} />, {
      plainText: true,
    });

    expect(text).toMatchSnapshot();
  });
});
