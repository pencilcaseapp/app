// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { AddImageError } from '~/services/document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-assets';
import type { Route } from './+types/doc-assets';

const addImageMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/document')>();
  return {
    ...actual,
    addImage: (...args: unknown[]) => addImageMock(...args),
  };
});

const assetId = 'b3f1c2d4-0000-4000-8000-000000000000';

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction(options: {
  signedIn?: boolean;
  file?: File;
  contentLength?: string;
} = {}) {
  const { signedIn = true, file, contentLength = '1024' } = options;
  const formData = new FormData();
  formData.set('csrf', 'test-token');

  if (file) {
    formData.set('file', file);
  }

  const body = new Request('http://localhost', {
    method: 'POST',
    body: formData,
  });
  const headers = new Headers(body.headers);
  headers.set('content-length', contentLength);
  const request = new Request(
    `http://localhost/doc/${documentFixture.id}/assets`,
    { method: 'POST', body: body.body, headers, duplex: 'half' } as RequestInit,
  );

  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, signedIn ? userFixture : null);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/assets',
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

const file = new File(['image'], 'image.png', { type: 'image/png' });

test('adds the image and answers with where it is served', async () => {
  addImageMock.mockResolvedValue([null, {
    id: assetId,
    width: 800,
    height: 600,
  }]);

  const result = await callAction({ file });

  expect(addImageMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    viewer: userFixture,
    file: expect.any(File),
  });
  expect(result).toStrictEqual({
    ok: true,
    id: assetId,
    src: `/doc/${documentFixture.id}/assets/${assetId}`,
    width: 800,
    height: 600,
  });
});

test('adds the image of a signed out editor without a viewer', async () => {
  addImageMock.mockResolvedValue([null, {
    id: assetId,
    width: 800,
    height: 600,
  }]);

  await callAction({ file, signedIn: false });

  expect(addImageMock).toHaveBeenCalledWith(
    expect.objectContaining({ viewer: undefined }),
  );
});

test('responds with 400 without a file', async () => {
  expect(await statusOf(callAction())).toBe(400);
  expect(addImageMock).not.toHaveBeenCalled();
});

test('responds with 413 before reading a body that is too large', async () => {
  const status = await statusOf(callAction({
    file,
    contentLength: String(11 * 1024 * 1024),
  }));

  expect(status).toBe(413);
  expect(addImageMock).not.toHaveBeenCalled();
});

test('responds with 413 without a content length', async () => {
  expect(await statusOf(callAction({ file, contentLength: '' }))).toBe(413);
});

test.each([
  [AddImageError.NotFound, 404],
  [AddImageError.PermissionDenied, 403],
  [AddImageError.TooLarge, 413],
  [AddImageError.UnsupportedType, 415],
])('maps the service error %s to %s', async (error, status) => {
  addImageMock.mockResolvedValue([error]);

  expect(await statusOf(callAction({ file }))).toBe(status);
});
