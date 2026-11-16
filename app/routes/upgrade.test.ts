// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';
import { loader } from './upgrade';
import type { Route } from './+types/upgrade';

const getLatestDocumentIdMock = vi.fn();
vi.mock('~/services/document', () => ({
  getLatestDocumentId:
    (...args: unknown[]) => getLatestDocumentIdMock(...args),
}));

const DOC_ID = '11111111-2222-4333-8444-555555555555';

beforeEach(() => {
  vi.clearAllMocks();
  getLatestDocumentIdMock.mockResolvedValue(DOC_ID);
});

function callLoader(search = '') {
  const request = new Request(`http://localhost/upgrade${search}`);
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return loader({
    request,
    url: new URL(request.url),
    pattern: '/upgrade',
    params: {},
    context,
  } as Route.LoaderArgs);
}

test('opens the subscription settings over the latest document',
  async () => {
    const response = await callLoader();

    expect(response.headers.get('Location'))
      .toBe(`/doc/${DOC_ID}/settings/subscription`);
    expect(getLatestDocumentIdMock).toHaveBeenCalledWith(userFixture);
  });

test('carries the search params along', async () => {
  const response = await callLoader('?toastDanger=Nope');

  expect(response.headers.get('Location'))
    .toBe(`/doc/${DOC_ID}/settings/subscription?toastDanger=Nope`);
});
