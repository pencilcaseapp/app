// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';
import { loader } from './upgrade';
import type { Route } from './+types/upgrade';

const getDocumentListMock = vi.fn();
const createDocumentMock = vi.fn();
vi.mock('~/repos/document', () => ({
  getDocumentList: (...args: unknown[]) => getDocumentListMock(...args),
  createDocument: (...args: unknown[]) => createDocumentMock(...args),
}));

const DOC_ID = '11111111-2222-4333-8444-555555555555';

beforeEach(() => {
  vi.clearAllMocks();
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
    getDocumentListMock.mockResolvedValue([{ id: DOC_ID }, { id: 'older' }]);

    const response = await callLoader();

    expect(response.headers.get('Location'))
      .toBe(`/doc/${DOC_ID}/settings/subscription`);
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

test('creates a document for a user without one', async () => {
  getDocumentListMock.mockResolvedValue([]);
  createDocumentMock.mockResolvedValue({ id: DOC_ID });

  const response = await callLoader();

  expect(response.headers.get('Location'))
    .toBe(`/doc/${DOC_ID}/settings/subscription`);
  expect(createDocumentMock).toHaveBeenCalledWith({ userId: userFixture.id });
});

test('carries the search params along', async () => {
  getDocumentListMock.mockResolvedValue([{ id: DOC_ID }]);

  const response = await callLoader('?toastDanger=Nope');

  expect(response.headers.get('Location'))
    .toBe(`/doc/${DOC_ID}/settings/subscription?toastDanger=Nope`);
});
