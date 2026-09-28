import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { expect, test } from 'vitest';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import {
  SubscriptionUpgrade,
  SubscriptionUpgradeFooter,
} from './subscription-upgrade';

const DOC_ID = '11111111-2222-4333-8444-555555555555';

function renderUpgrade(documentCount = 2) {
  const Stub = createRoutesStub([
    {
      path: '/settings/subscription',
      Component: () => (
        <>
          <SubscriptionUpgrade documentCount={documentCount} />
          <SubscriptionUpgradeFooter documentId={DOC_ID} />
        </>
      ),
    },
  ]);

  return render(<Stub initialEntries={['/settings/subscription']} />);
}

test('compares the free plan against pro', () => {
  const { container } = renderUpgrade(2);

  expect(screen.getByRole('heading', {
    name: `You’ve used 2 of your ${FREE_DOCUMENT_LIMIT} free docs.`,
  })).toBeInTheDocument();
  for (const badge of screen.getAllByText('Current')) {
    expect(badge.closest('.bg-pca-white')).toBeInTheDocument();
  }
  expect(screen.getByText('Secure checkout by Creem.')).toBeInTheDocument();
  expect(screen.getByRole('rowheader', { name: 'Docs' })).toBeInTheDocument();
  expect(screen.getAllByTitle('Not included')).toHaveLength(2);
  expect(screen.getByRole('link', { name: 'Upgrade to Pro' }))
    .toBeInTheDocument();
  expect(container).toMatchSnapshot();
});

test('tells a user at the limit that all docs are in use', () => {
  renderUpgrade(FREE_DOCUMENT_LIMIT);

  expect(screen.getByRole('heading', {
    name: `You’ve used all ${FREE_DOCUMENT_LIMIT} of your free docs.`,
  })).toBeInTheDocument();
});

test('links to the checkout over the same document', () => {
  renderUpgrade();

  expect(screen.getByRole('link', { name: 'Upgrade to Pro' }))
    .toHaveAttribute('href', `/doc/${DOC_ID}/checkout`);
});
