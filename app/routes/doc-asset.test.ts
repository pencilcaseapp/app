// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { OpenAssetError } from '~/services/document';
import { userFixture } from '~/test/fixtures/user';
import { loader } from './doc-asset';
import type { Route } from './+types/doc-asset';

const openAssetMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/document')>();
  return {
    ...actual,
    openAsset: (...args: unknown[]) => openAssetMock(...args),
  };
});

const documentId = 'a1e0b1c3-0000-4000-8000-000000000000';
const assetId = 'b3f1c2d4-0000-4000-8000-000000000000';

beforeEach(() => {
  vi.clearAllMocks();
});

function callLoader(signedIn = true) {
  const request = new Request(`http://localhost/doc/${documentId}/assets/${assetId}`);
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, signedIn ? userFixture : null);

  return loader({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/assets/:assetId',
    params: { id: documentId, assetId },
    context,
  } as Route.LoaderArgs);
}

test('streams the asset privately cacheable', async () => {
  openAssetMock.mockResolvedValue([null, {
    contentType: 'image/webp',
    byteSize: 5,
    body: new Response('image').body,
  }]);

  const response = await callLoader();

  expect(openAssetMock).toHaveBeenCalledWith(documentId, assetId, userFixture);
  expect(await response.text()).toBe('image');
  expect(Object.fromEntries(response.headers)).toMatchObject({
    'content-type': 'image/webp',
    'content-length': '5',
    'cache-control': 'private, max-age=3600',
    'x-content-type-options': 'nosniff',
  });
});

test('redirects to the signed URL for as long as it may be kept', async () => {
  const url = 'https://cdn.example/documents/a/b.webp?token=t&expires=1';
  openAssetMock.mockResolvedValue([null, { url, maxAge: 120 }]);

  const response = await callLoader();

  expect(response.status).toBe(302);
  expect(Object.fromEntries(response.headers)).toStrictEqual({
    'location': url,
    'cache-control': 'private, max-age=120',
  });
});

test('opens the asset without a viewer when signed out', async () => {
  openAssetMock.mockResolvedValue([OpenAssetError.NotFound]);

  await callLoader(false).catch(() => {});

  expect(openAssetMock).toHaveBeenCalledWith(documentId, assetId, undefined);
});

test('responds with 404 when the asset is not for the viewer', async () => {
  openAssetMock.mockResolvedValue([OpenAssetError.NotFound]);

  await expect(callLoader()).rejects.toMatchObject({
    init: { status: 404 },
  });
});
