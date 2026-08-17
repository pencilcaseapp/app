import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import { OtpCodeEmail, otpCodeEmailSubject } from './otp-code';

const code = '396921';

describe('otpCodeEmailSubject', () => {
  it('carries the code so iOS can offer it from the notification', () => {
    expect(otpCodeEmailSubject(code)).toContain(code);
  });
});

describe('OtpCodeEmail', () => {
  it('keeps the code a single unbroken run of digits', async () => {
    const html = await render(<OtpCodeEmail code={code} />);

    expect(html).toMatch(new RegExp(`>${code}<`));
  });

  it('pairs the word "code" with the digits in the plain text body', async () => {
    const text = await render(<OtpCodeEmail code={code} />, {
      plainText: true,
    });

    expect(text).toMatch(new RegExp(`code[^0-9]*${code}`, 'i'));
  });

  it('is the only code-shaped number in the message', async () => {
    const text = await render(<OtpCodeEmail code={code} />, {
      plainText: true,
    });

    expect(text.match(/\d{4,8}/g)).toEqual([code]);
  });

  it('repeats the code in the preheader', async () => {
    const html = await render(<OtpCodeEmail code={code} />);

    expect(html).toContain(`Your verification code is ${code}`);
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(<OtpCodeEmail code={code} />);

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('breaks the headline onto two lines', async () => {
    const html = await render(<OtpCodeEmail code={code} />);

    expect(html).toContain('One-Time<br/>Verification Code');
  });

  it('matches the rendered markup', async () => {
    const html = await render(<OtpCodeEmail code={code} />, { pretty: true });

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(<OtpCodeEmail code={code} />, {
      plainText: true,
    });

    expect(text).toMatchSnapshot();
  });
});
