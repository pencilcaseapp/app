import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import {
  SubscriptionPaymentFailedEmail,
  subscriptionPaymentFailedEmailSubject,
} from './subscription-payment-failed';

const portalUrl = 'https://pencilcase.app/billing-portal';

describe('subscriptionPaymentFailedEmailSubject', () => {
  it('says what went wrong', () => {
    expect(subscriptionPaymentFailedEmailSubject())
      .toBe('Payment for pencil case PRO failed');
  });
});

describe('SubscriptionPaymentFailedEmail', () => {
  it('links to the customer portal', async () => {
    const html = await render(
      <SubscriptionPaymentFailedEmail portalUrl={portalUrl} />,
    );

    expect(html).toContain(`href="${portalUrl}"`);
  });

  it('keeps the portal link in the plain text body', async () => {
    const text = await render(
      <SubscriptionPaymentFailedEmail portalUrl={portalUrl} />,
      { plainText: true },
    );

    expect(text).toContain(portalUrl);
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(
      <SubscriptionPaymentFailedEmail portalUrl={portalUrl} />,
    );

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('matches the rendered markup', async () => {
    const html = await render(
      <SubscriptionPaymentFailedEmail portalUrl={portalUrl} />,
      { pretty: true },
    );

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(
      <SubscriptionPaymentFailedEmail portalUrl={portalUrl} />,
      { plainText: true },
    );

    expect(text).toMatchSnapshot();
  });
});
