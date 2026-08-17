import { render } from '@react-email/components';
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

    // A per-digit span or a space between the digits stops iOS from
    // recognising the code at all.
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

    // iOS looks for runs of four to eight digits, so a second one anywhere in
    // the copy gives it something wrong to suggest. The expiry reads "15",
    // which is short enough not to compete.
    expect(text.match(/\d{4,8}/g)).toEqual([code]);
  });

  it('repeats the code in the preheader', async () => {
    const html = await render(<OtpCodeEmail code={code} />);

    // The preheader is the first text in the HTML body, which makes it the
    // first place iOS looks — and it is what the inbox list shows.
    expect(html).toContain(`Your verification code is ${code}`);
  });
});
