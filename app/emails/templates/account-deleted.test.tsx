import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import {
  AccountDeletedEmail,
  accountDeletedEmailSubject,
} from './account-deleted';

const props = {
  restoreUntil: '23 December 2026',
  signInUrl: 'https://docs.pencilcase.app/signin',
};

describe('accountDeletedEmailSubject', () => {
  it('says the account will be deleted', () => {
    expect(accountDeletedEmailSubject())
      .toBe('Your pencil case account will be deleted');
  });
});

describe('AccountDeletedEmail', () => {
  it('links to the sign in page for restoring the account', async () => {
    const html = await render(<AccountDeletedEmail {...props} />);

    expect(html).toContain(`href="${props.signInUrl}"`);
  });

  it('confirms the request, the 30 days and the last day to restore', async () => {
    const text = await render(
      <AccountDeletedEmail {...props} />,
      { plainText: true },
    );

    expect(text).toMatch(/received your request to delete/i);
    expect(text).toMatch(/in 30 days/i);
    expect(text).toContain('by 23 December 2026');
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(<AccountDeletedEmail {...props} />);

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it('matches the rendered markup', async () => {
    const html = await render(
      <AccountDeletedEmail {...props} />,
      { pretty: true },
    );

    expect(html).toMatchSnapshot();
  });

  it('matches the plain text body', async () => {
    const text = await render(
      <AccountDeletedEmail {...props} />,
      { plainText: true },
    );

    expect(text).toMatchSnapshot();
  });
});
