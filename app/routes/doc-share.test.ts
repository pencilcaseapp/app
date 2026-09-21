// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { ShareDocumentError } from '~/services/document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-share';
import type { Route } from './+types/doc-share';

const shareDocumentMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/document')>();
  return {
    ...actual,
    shareDocument: (...args: unknown[]) => shareDocumentMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction(shared: string) {
  const formData = new FormData();
  formData.set('csrf', 'test-token');
  formData.set('shared', shared);

  const request = new Request(
    `http://localhost/doc/${documentFixture.id}/share`,
    { method: 'POST', body: formData },
  );
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/share',
    params: { id: documentFixture.id },
    context,
  } as Route.ActionArgs);
}

test('shares the document for the signed in user', async () => {
  shareDocumentMock.mockResolvedValue([null, { shared: true }]);

  const result = await callAction('true');

  expect(shareDocumentMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    userId: userFixture.id,
    shared: true,
  });
  expect(result).toStrictEqual({ ok: true, shared: true });
});

test('responds with 403 when the service denies the user', async () => {
  shareDocumentMock.mockResolvedValue([ShareDocumentError.PermissionDenied]);

  await expect(callAction('false')).rejects.toMatchObject({
    init: { status: 403 },
  });
});
