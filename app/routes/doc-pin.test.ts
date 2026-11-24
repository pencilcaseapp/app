// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { PinDocumentError } from '~/services/document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-pin';
import type { Route } from './+types/doc-pin';

const pinDocumentMock = vi.fn();
const unpinDocumentMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/document')>();
  return {
    ...actual,
    pinDocument: (...args: unknown[]) => pinDocumentMock(...args),
    unpinDocument: (...args: unknown[]) => unpinDocumentMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction(pinned: string) {
  const formData = new FormData();
  formData.set('csrf', 'test-token');
  formData.set('pinned', pinned);

  const request = new Request(
    `http://localhost/doc/${documentFixture.id}/pin`,
    { method: 'POST', body: formData },
  );
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/pin',
    params: { id: documentFixture.id },
    context,
  } as Route.ActionArgs);
}

test('pins the document for the signed in user', async () => {
  pinDocumentMock.mockResolvedValue([null]);

  const result = await callAction('true');

  expect(pinDocumentMock).toHaveBeenCalledWith(documentFixture.id, userFixture);
  expect(result).toStrictEqual({ ok: true, pinned: true });
});

test('unpins the document for the signed in user', async () => {
  const result = await callAction('false');

  expect(unpinDocumentMock)
    .toHaveBeenCalledWith(documentFixture.id, userFixture.id);
  expect(pinDocumentMock).not.toHaveBeenCalled();
  expect(result).toStrictEqual({ ok: true, pinned: false });
});

test('responds with 404 when the document cannot be pinned', async () => {
  pinDocumentMock.mockResolvedValue([PinDocumentError.NotFound]);

  await expect(callAction('true')).rejects.toMatchObject({
    init: { status: 404 },
  });
});
