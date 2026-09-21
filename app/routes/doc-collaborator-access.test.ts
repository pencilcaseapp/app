// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { ChangeCollaboratorAccessError } from '~/services/document-invite';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-collaborator-access';
import type { Route } from './+types/doc-collaborator-access';

const changeCollaboratorAccessMock = vi.fn();
vi.mock('~/services/document-invite', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('~/services/document-invite')>();
  return {
    ...actual,
    changeCollaboratorAccess: (...args: unknown[]) =>
      changeCollaboratorAccessMock(...args),
  };
});

const collaboratorId = 'a1b2c3d4-0000-4000-8000-000000000000';

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction(access: string) {
  const formData = new FormData();
  formData.set('csrf', 'test-token');
  formData.set('access', access);
  const url = `http://localhost/doc/${documentFixture.id}`
    + `/collaborators/${collaboratorId}/access`;
  const request = new Request(url, { method: 'POST', body: formData });
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/collaborators/:collaboratorId/access',
    params: { id: documentFixture.id, collaboratorId },
    context,
  } as Route.ActionArgs);
}

test('changes the access for the signed in user', async () => {
  changeCollaboratorAccessMock.mockResolvedValue([null, { access: 'view' }]);

  const result = await callAction('view');

  expect(changeCollaboratorAccessMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    userId: userFixture.id,
    collaboratorId,
    access: 'view',
  });
  expect(result).toStrictEqual({ ok: true, access: 'view' });
});

test('responds with 400 for an access the document does not know', async () => {
  await expect(callAction('admin')).rejects.toMatchObject({
    init: { status: 400 },
  });
  expect(changeCollaboratorAccessMock).not.toHaveBeenCalled();
});

test('responds with 403 when the service denies the user', async () => {
  changeCollaboratorAccessMock
    .mockResolvedValue([ChangeCollaboratorAccessError.PermissionDenied]);

  await expect(callAction('edit')).rejects.toMatchObject({
    init: { status: 403 },
  });
});
