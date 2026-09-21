// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { userSessionContext } from '~/contexts/user-session';
import { ChangeLinkAccessError } from '~/services/document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './doc-link-access';
import type { Route } from './+types/doc-link-access';

const changeLinkAccessMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/services/document')>();
  return {
    ...actual,
    changeLinkAccess: (...args: unknown[]) => changeLinkAccessMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction(linkAccess: string) {
  const formData = new FormData();
  formData.set('csrf', 'test-token');
  formData.set('linkAccess', linkAccess);
  const request = new Request(
    `http://localhost/doc/${documentFixture.id}/link-access`,
    { method: 'POST', body: formData },
  );
  const context = new RouterContextProvider();
  context.set(userSessionContext, userFixture);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id/link-access',
    params: { id: documentFixture.id },
    context,
  } as Route.ActionArgs);
}

test('changes the link access for the signed in user', async () => {
  changeLinkAccessMock.mockResolvedValue([null, { linkAccess: 'edit' }]);

  const result = await callAction('edit');

  expect(changeLinkAccessMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    userId: userFixture.id,
    linkAccess: 'edit',
  });
  expect(result).toStrictEqual({ ok: true, linkAccess: 'edit' });
});

test('responds with 400 for an access the document does not know', async () => {
  await expect(callAction('admin')).rejects.toMatchObject({
    init: { status: 400 },
  });
  expect(changeLinkAccessMock).not.toHaveBeenCalled();
});

test('responds with 403 when the service denies the user', async () => {
  changeLinkAccessMock
    .mockResolvedValue([ChangeLinkAccessError.PermissionDenied]);

  await expect(callAction('edit')).rejects.toMatchObject({
    init: { status: 403 },
  });
});
