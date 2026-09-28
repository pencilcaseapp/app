// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { OpenAssetError } from '~/services/asset';
import { userFixture } from '~/test/fixtures/user';
import { loader } from './user-assets';
import type { Route } from './+types/user-assets';

const openAssetMock = vi.fn();
vi.mock('~/services/asset', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/asset')>();
  return {
    ...actual,
    openAsset: (...args: unknown[]) => openAssetMock(...args),
  };
});

const assetId = 'b3f1c2d4-0000-4000-8000-000000000000';

beforeEach(() => {
  vi.clearAllMocks();
});

function callLoader(signedIn = true) {
  const request = new Request(`http://localhost/user-assets/${assetId}`);
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, signedIn ? userFixture : null);

  return loader({
    request,
    url: new URL(request.url),
    pattern: '/user-assets/:assetId',
    params: { assetId },
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

  expect(openAssetMock).toHaveBeenCalledWith(assetId, userFixture);
  expect(await response.text()).toBe('image');
  expect(Object.fromEntries(response.headers)).toMatchObject({
    'content-type': 'image/webp',
    'content-length': '5',
    'cache-control': 'private, max-age=3600',
    'x-content-type-options': 'nosniff',
  });
});

test('opens the asset without a viewer when signed out', async () => {
  openAssetMock.mockResolvedValue([OpenAssetError.NotFound]);

  await callLoader(false).catch(() => {});

  expect(openAssetMock).toHaveBeenCalledWith(assetId, undefined);
});

test('responds with 404 when the asset is not for the viewer', async () => {
  openAssetMock.mockResolvedValue([OpenAssetError.NotFound]);

  await expect(callLoader()).rejects.toMatchObject({
    init: { status: 404 },
  });
});
