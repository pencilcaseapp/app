// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { LeaveDocumentError } from '~/services/document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-leave';
import type { Route } from './+types/doc-leave';

const leaveDocumentMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/document')>();
  return {
    ...actual,
    leaveDocument: (...args: unknown[]) => leaveDocumentMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction() {
  const formData = new FormData();
  formData.set('csrf', 'test-token');
  const request = new Request(
    `http://localhost/doc/${documentFixture.id}/leave`,
    { method: 'POST', body: formData },
  );
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/leave',
    params: { id: documentFixture.id },
    context,
  } as Route.ActionArgs);
}

test('removes the document for the signed in user', async () => {
  leaveDocumentMock.mockResolvedValue([null, { id: documentFixture.id }]);

  const result = await callAction();

  expect(leaveDocumentMock).toHaveBeenCalledWith(documentFixture.id, {
    id: userFixture.id,
    email: userFixture.email,
  });
  expect(result).toStrictEqual({ ok: true, id: documentFixture.id });
});

test('responds with 403 when the service denies the user', async () => {
  leaveDocumentMock.mockResolvedValue([LeaveDocumentError.PermissionDenied]);

  await expect(callAction()).rejects.toMatchObject({
    init: { status: 403 },
  });
});
