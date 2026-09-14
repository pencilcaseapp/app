// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { DeleteDocumentError } from '~/services/document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-restore';
import type { Route } from './+types/doc-restore';

const restoreDocumentMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/document')>();
  return {
    ...actual,
    restoreDocument: (...args: unknown[]) => restoreDocumentMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction() {
  const formData = new FormData();
  formData.set('csrf', 'test-token');
  const request = new Request(
    `http://localhost/doc/${documentFixture.id}/restore`,
    { method: 'POST', body: formData },
  );
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/restore',
    params: { id: documentFixture.id },
    context,
  } as Route.ActionArgs);
}

test('restores the document for the signed in user', async () => {
  restoreDocumentMock.mockResolvedValue([null, { id: documentFixture.id }]);

  const result = await callAction();

  expect(restoreDocumentMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    userId: userFixture.id,
  });
  expect(result).toStrictEqual({ ok: true, id: documentFixture.id });
});

test('responds with 403 when the service denies the user', async () => {
  restoreDocumentMock.mockResolvedValue([DeleteDocumentError.PermissionDenied]);

  await expect(callAction()).rejects.toMatchObject({
    init: { status: 403 },
  });
});
