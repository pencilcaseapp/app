import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { DocumentLimitDialog } from './document-limit-dialog';

test('explains the limit and links the upgrade to the checkout', () => {
  render(
    <DocumentLimitDialog
      checkoutUrl="/doc/123/checkout"
      open
      onOpenChange={vi.fn()}
    />,
  );

  expect(
    screen.getByRole('dialog', { name: 'Upgrade to Pro' }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      `You’ve used all ${FREE_DOCUMENT_LIMIT} of your free docs, `
      + 'but getting more is easy.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Upgrade to Pro' }),
  ).toHaveAttribute('href', '/doc/123/checkout');
});

test('renders nothing while closed', () => {
  render(
    <DocumentLimitDialog
      checkoutUrl="/doc/123/checkout"
      open={false}
      onOpenChange={vi.fn()}
    />,
  );

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
