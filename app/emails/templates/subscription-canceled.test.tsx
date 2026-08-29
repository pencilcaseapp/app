import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import {
  SubscriptionCanceledEmail,
  subscriptionCanceledEmailSubject,
} from './subscription-canceled';

const upgradeUrl = 'https://pencilcase.app/upgrade';

describe('subscriptionCanceledEmailSubject', () => {
  it('says the subscription has ended', () => {
    expect(subscriptionCanceledEmailSubject())
      .toBe('Your pencil case PRO subscription has ended');
  });
});

describe('SubscriptionCanceledEmail', () => {
  it('links to the upgrade page for resubscribing', async () => {
    const html = await render(
      <SubscriptionCanceledEmail upgradeUrl={upgradeUrl} />,
    );

    expect(html).toContain(`href="${upgradeUrl}"`);
  });

  it('reassures that documents are kept', async () => {
    const text = await render(
      <SubscriptionCanceledEmail upgradeUrl={upgradeUrl} />,
      { plainText: true },
    );

    expect(text).toMatch(/documents stay/i);
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(
      <SubscriptionCanceledEmail upgradeUrl={upgradeUrl} />,
    );

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('matches the rendered markup', async () => {
    const html = await render(
      <SubscriptionCanceledEmail upgradeUrl={upgradeUrl} />,
      { pretty: true },
    );

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(
      <SubscriptionCanceledEmail upgradeUrl={upgradeUrl} />,
      { plainText: true },
    );

    expect(text).toMatchSnapshot();
  });
});
