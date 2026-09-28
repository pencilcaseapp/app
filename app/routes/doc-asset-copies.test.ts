// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { CopyImageError } from '~/services/asset';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-asset-copies';
import type { Route } from './+types/doc-asset-copies';

const copyImageMock = vi.fn();
vi.mock('~/services/asset', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/asset')>();
  return {
    ...actual,
    copyImage: (...args: unknown[]) => copyImageMock(...args),
  };
});

const assetId = 'b3f1c2d4-0000-4000-8000-000000000000';
const src = '/doc/c4a2d3e5-0000-4000-8000-000000000000/assets/'
  + 'd5b3e4f6-0000-4000-8000-000000000000';

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction(signedIn = true) {
  const formData = new FormData();
  formData.set('csrf', 'test-token');
  formData.set('src', src);

  const request = new Request(
    `http://localhost/doc/${documentFixture.id}/assets/copies`,
    { method: 'POST', body: formData },
  );
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, signedIn ? userFixture : null);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/assets/copies',
    params: { id: documentFixture.id },
    context,
  } as Route.ActionArgs);
}

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
  }
  catch (error) {
    return (error as { init?: ResponseInit }).init?.status;
  }
}

test('copies the image and answers with where the copy is served', async () => {
  copyImageMock.mockResolvedValue([null, {
    id: assetId,
    width: 800,
    height: 600,
  }]);

  const result = await callAction();

  expect(copyImageMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    viewer: userFixture,
    src,
  });
  expect(result).toStrictEqual({
    ok: true,
    id: assetId,
    src: `/doc/${documentFixture.id}/assets/${assetId}`,
    width: 800,
    height: 600,
  });
});

test('copies for a signed out editor without a viewer', async () => {
  copyImageMock.mockResolvedValue([CopyImageError.NotFound]);

  await callAction(false).catch(() => {});

  expect(copyImageMock).toHaveBeenCalledWith(
    expect.objectContaining({ viewer: undefined }),
  );
});

test.each([
  [CopyImageError.NotFound, 404],
  [CopyImageError.PermissionDenied, 403],
])('answers error %s with %s', async (error, status) => {
  copyImageMock.mockResolvedValue([error]);

  expect(await statusOf(callAction())).toBe(status);
});
