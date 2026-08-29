import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import {
  SubscriptionStartedEmail,
  subscriptionStartedEmailSubject,
} from './subscription-started';

describe('subscriptionStartedEmailSubject', () => {
  it('names the product', () => {
    expect(subscriptionStartedEmailSubject())
      .toBe('Welcome to pencil case PRO');
  });
});

describe('SubscriptionStartedEmail', () => {
  it('points to Creem for the receipt', async () => {
    const text = await render(<SubscriptionStartedEmail />, {
      plainText: true,
    });

    expect(text).toMatch(/creem[^.]*receipt/i);
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(<SubscriptionStartedEmail />);

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('matches the rendered markup', async () => {
    const html = await render(<SubscriptionStartedEmail />, {
      pretty: true,
    });

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(<SubscriptionStartedEmail />, {
      plainText: true,
    });

    expect(text).toMatchSnapshot();
  });
});
