import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import type { ContractNotice } from '~/constants/contract-notice';
import {
  ContractNoticeEmail,
  contractNoticeEmailSubject,
} from './contract-notice';

const receivedAt = new Date('2026-11-16T13:56:42Z');

const cancellation: ContractNotice = {
  kind: 'cancellation',
  name: 'Sam Doe',
  email: 'sam@example.com',
  cancellationType: 'extraordinary',
  reason: 'The service is down for weeks.',
  endsOn: '2026-12-31',
};

const withdrawal: ContractNotice = {
  kind: 'withdrawal',
  name: 'Sam Doe',
  email: 'sam@example.com',
};

describe('contractNoticeEmailSubject', () => {
  it('tells the customer what reached us', () => {
    expect(contractNoticeEmailSubject(cancellation, 'customer'))
      .toBe('We received your cancellation');
    expect(contractNoticeEmailSubject(withdrawal, 'customer'))
      .toBe('We received your withdrawal');
  });

  it('names the sender in the inbox', () => {
    expect(contractNoticeEmailSubject(cancellation, 'inbox'))
      .toBe('Cancellation: sam@example.com');
    expect(contractNoticeEmailSubject(withdrawal, 'inbox'))
      .toBe('Withdrawal: sam@example.com');
  });
});

describe('ContractNoticeEmail', () => {
  it('carries the cancellation and when it was received', async () => {
    const text = await render(
      <ContractNoticeEmail notice={cancellation} receivedAt={receivedAt} />,
      { plainText: true },
    );

    expect(text).toContain('I cancel my contract for pencil case Pro.');
    expect(text).toContain('Extraordinary, for good cause');
    expect(text).toContain('The service is down for weeks.');
    expect(text).toContain('31 December 2026');
    expect(text).toContain('Sam Doe');
    expect(text).toContain('16 November 2026 at 14:56 CET');
  });

  it('ends at the earliest date without one asked for', async () => {
    const text = await render(
      <ContractNoticeEmail
        notice={{ ...cancellation, endsOn: null }}
        receivedAt={receivedAt}
      />,
      { plainText: true },
    );

    expect(text).toContain('At the earliest possible date');
  });

  it('carries the withdrawal and when it was received', async () => {
    const text = await render(
      <ContractNoticeEmail notice={withdrawal} receivedAt={receivedAt} />,
      { plainText: true },
    );

    expect(text).toContain('I withdraw from my contract for pencil case Pro.');
    expect(text).toContain('16 November 2026 at 14:56 CET');
    expect(text).not.toContain('Ends');
  });

  it('renders every size in pixels rather than rem', async () => {
    const html = await render(
      <ContractNoticeEmail notice={cancellation} receivedAt={receivedAt} />,
    );

    expect(html).not.toMatch(/[\d.]+rem/);
  });

  it.each([cancellation, withdrawal])(
    'matches the rendered $kind',
    async (notice) => {
      const props = { notice, receivedAt };
      const html = await render(<ContractNoticeEmail {...props} />, {
        pretty: true,
      });
      const text = await render(<ContractNoticeEmail {...props} />, {
        plainText: true,
      });

      expect(html).toMatchSnapshot();
      expect(text).toMatchSnapshot();
    },
  );
});
