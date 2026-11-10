// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';
import { loader } from './checkout';
import type { Route } from './+types/checkout';

const getLatestDocumentIdMock = vi.fn();
vi.mock('~/services/document', () => ({
  getLatestDocumentId:
    (...args: unknown[]) => getLatestDocumentIdMock(...args),
}));

const DOC_ID = '11111111-2222-4333-8444-555555555555';

test('starts the checkout over the latest document', async () => {
  getLatestDocumentIdMock.mockResolvedValue(DOC_ID);
  const request = new Request('http://localhost/checkout');
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  const response = await loader({
    request,
    url: new URL(request.url),
    pattern: '/checkout',
    params: {},
    context,
  } as Route.LoaderArgs);

  expect(response.headers.get('Location')).toBe(`/doc/${DOC_ID}/checkout`);
  expect(getLatestDocumentIdMock).toHaveBeenCalledWith(userFixture);
});
