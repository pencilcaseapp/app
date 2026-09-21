// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { RemoveCollaboratorError } from '~/services/document-invite';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-collaborator-remove';
import type { Route } from './+types/doc-collaborator-remove';

const removeCollaboratorMock = vi.fn();
vi.mock('~/services/document-invite', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('~/services/document-invite')>();
  return {
    ...actual,
    removeCollaborator: (...args: unknown[]) => removeCollaboratorMock(...args),
  };
});

const collaboratorId = 'a1b2c3d4-0000-4000-8000-000000000000';

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction() {
  const formData = new FormData();
  formData.set('csrf', 'test-token');
  const url = `http://localhost/doc/${documentFixture.id}`
    + `/collaborators/${collaboratorId}/remove`;
  const request = new Request(url, { method: 'POST', body: formData });
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/collaborators/:collaboratorId/remove',
    params: { id: documentFixture.id, collaboratorId },
    context,
  } as Route.ActionArgs);
}

test('removes the collaborator for the signed in user', async () => {
  removeCollaboratorMock.mockResolvedValue([null, { id: collaboratorId }]);

  const result = await callAction();

  expect(removeCollaboratorMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    userId: userFixture.id,
    collaboratorId,
  });
  expect(result).toStrictEqual({ ok: true, id: collaboratorId });
});

test('responds with 403 when the service denies the user', async () => {
  removeCollaboratorMock
    .mockResolvedValue([RemoveCollaboratorError.PermissionDenied]);

  await expect(callAction()).rejects.toMatchObject({
    init: { status: 403 },
  });
});
