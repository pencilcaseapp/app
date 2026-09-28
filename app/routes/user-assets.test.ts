// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { FindAssetError } from '~/services/asset';
import { userFixture } from '~/test/fixtures/user';
import { loader } from './user-assets';
import type { Route } from './+types/user-assets';

const findAssetMock = vi.fn();
const readAssetMock = vi.fn();
vi.mock('~/services/asset', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/asset')>();
  return {
    ...actual,
    findAsset: (...args: unknown[]) => findAssetMock(...args),
    readAsset: (...args: unknown[]) => readAssetMock(...args),
  };
});

const assetId = 'b3f1c2d4-0000-4000-8000-000000000000';
const asset = { id: assetId, contentType: 'image/webp' };

beforeEach(() => {
  vi.clearAllMocks();
});

function callLoader(signedIn = true, headers: HeadersInit = {}) {
  const request = new Request(`http://localhost/user-assets/${assetId}`, {
    headers,
  });
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

test('serves the asset privately cacheable', async () => {
  findAssetMock.mockResolvedValue([null, asset]);
  readAssetMock.mockResolvedValue(new TextEncoder().encode('image'));

  const response = await callLoader();

  expect(findAssetMock).toHaveBeenCalledWith(assetId, userFixture);
  expect(readAssetMock).toHaveBeenCalledWith(asset);
  expect(await response.text()).toBe('image');
  expect(Object.fromEntries(response.headers)).toMatchObject({
    'content-type': 'image/webp',
    'content-length': '5',
    'cache-control': 'private, max-age=3600',
    'etag': `"${assetId}"`,
    'x-content-type-options': 'nosniff',
  });
});

test('answers a browser whose copy is current with 304', async () => {
  findAssetMock.mockResolvedValue([null, asset]);

  const response = await callLoader(true, {
    'If-None-Match': `W/"other", "${assetId}"`,
  });

  expect(response.status).toBe(304);
  expect(response.headers.get('etag')).toBe(`"${assetId}"`);
  expect(readAssetMock).not.toHaveBeenCalled();
});

test('opens the asset without a viewer when signed out', async () => {
  findAssetMock.mockResolvedValue([FindAssetError.NotFound]);

  await callLoader(false).catch(() => {});

  expect(findAssetMock).toHaveBeenCalledWith(assetId, undefined);
});

test('responds with 404 when the asset is not for the viewer', async () => {
  findAssetMock.mockResolvedValue([FindAssetError.NotFound]);

  await expect(callLoader(true, {
    'If-None-Match': `"${assetId}"`,
  })).rejects.toMatchObject({ init: { status: 404 } });
  expect(readAssetMock).not.toHaveBeenCalled();
});

test('responds with 404 when the bucket has lost the file', async () => {
  findAssetMock.mockResolvedValue([null, asset]);
  readAssetMock.mockResolvedValue(undefined);

  await expect(callLoader()).rejects.toMatchObject({
    init: { status: 404 },
  });
});
