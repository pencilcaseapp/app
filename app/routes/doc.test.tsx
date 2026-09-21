import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { documentInviteCopies } from '~/constants/document';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { OpenDocumentError } from '~/services/document';
import { InviteCollaboratorError } from '~/services/document-invite';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';
import { action } from './doc';
import type { Route } from './+types/doc';

const redirectMock = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    redirect: (url: string, init?: number | ResponseInit) => {
      redirectMock(url);
      return actual.redirect(url, init);
    },
  };
});

const openDocumentMock = vi.fn();
vi.mock('~/services/document', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual as object,
    openDocument: (...args: unknown[]) => openDocumentMock(...args),
  };
});

const inviteCollaboratorMock = vi.fn();
const listInvitedCollaboratorsMock = vi.fn();
vi.mock('~/services/document-invite', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual as object,
    inviteCollaborator: (...args: unknown[]) =>
      inviteCollaboratorMock(...args),
    listInvitedCollaborators: (...args: unknown[]) =>
      listInvitedCollaboratorsMock(...args),
  };
});

const documentUrl = `/doc/${documentFixture.id}`;

beforeEach(() => {
  vi.clearAllMocks();
  listInvitedCollaboratorsMock.mockResolvedValue([]);
});

function renderDoc(context: RouterContextProvider) {
  return renderRoute('/doc/:id', {
    params: { id: documentFixture.id },
    context,
  });
}

function openedDocument(overrides?: Partial<{
  isOwner: boolean;
  shared: boolean;
  deleted: boolean;
  readOnly: boolean;
  hasJoined: boolean;
}>) {
  const deleted = overrides?.deleted ?? false;

  return [null, {
    title: documentFixture.title,
    shared: false,
    linkAccess: 'view',
    isOwner: true,
    deleted,
    // A deleted document opens read-only, the way the service reports it.
    readOnly: deleted,
    hasJoined: false,
    ...overrides,
  }];
}

test('opens the document for the signed in viewer', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock.mockResolvedValue(openedDocument());

  const { queryByText } = await renderDoc(context);

  expect(openDocumentMock)
    .toHaveBeenCalledWith(documentFixture.id, userFixture);
  expect(queryByText('Permission Denied')).not.toBeInTheDocument();
  expect(redirectMock).not.toHaveBeenCalled();
});

test('lists the invited people for the owner', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock.mockResolvedValue(openedDocument());
  listInvitedCollaboratorsMock.mockResolvedValue([{
    id: 'a1b2c3d4-0000-4000-8000-000000000000',
    name: null,
    email: 'grace@example.com',
    access: 'edit',
    pending: true,
  }]);

  const { findByText } = await renderDoc(context);

  expect(listInvitedCollaboratorsMock)
    .toHaveBeenCalledWith(documentFixture.id);
  expect(await findByText('Share')).toBeInTheDocument();
});

test('does not look the invited people up for a visitor', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock.mockResolvedValue(
    openedDocument({ isOwner: false, shared: true }),
  );

  await renderDoc(context);

  expect(listInvitedCollaboratorsMock).not.toHaveBeenCalled();
});

test('renders not found state', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock.mockResolvedValue([OpenDocumentError.NotFound]);

  const { findByText } = await renderDoc(context);

  expect(await findByText('Not Found')).toBeInTheDocument();
});

test('renders permission denied state', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock.mockResolvedValue([OpenDocumentError.PermissionDenied]);

  const { findByText } = await renderDoc(context);

  expect(await findByText('Permission Denied')).toBeInTheDocument();
});

test('sends an anonymous visitor to sign in', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, null);
  openDocumentMock.mockResolvedValue([OpenDocumentError.PermissionDenied]);

  await renderDoc(context);

  await vi.waitFor(() => {
    expect(redirectMock)
      .toHaveBeenCalledWith(`/signin?returnUrl=${encodeURIComponent(documentUrl)}`);
  });
});

test('redirects a visitor who just joined to refresh the nav', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock
    .mockResolvedValueOnce(
      openedDocument({ isOwner: false, shared: true, hasJoined: true }),
    )
    .mockResolvedValue(openedDocument({ isOwner: false, shared: true }));

  await renderDoc(context);

  await vi.waitFor(() => {
    expect(redirectMock).toHaveBeenCalledWith(documentUrl);
  });
});

test('lets an anonymous visitor read a shared document', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, null);
  openDocumentMock.mockResolvedValue(
    openedDocument({ isOwner: false, shared: true }),
  );

  const { queryByText } = await renderDoc(context);

  expect(openDocumentMock)
    .toHaveBeenCalledWith(documentFixture.id, undefined);
  expect(queryByText('Permission Denied')).not.toBeInTheDocument();
  expect(redirectMock).not.toHaveBeenCalled();
});

test('opens a deleted document read-only with a notice', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  openDocumentMock.mockResolvedValue(openedDocument({ deleted: true }));

  const { findByText, queryByRole, container } = await renderDoc(context);

  expect(await findByText('This document is deleted and will be removed for good in 30 days.'))
    .toBeInTheDocument();
  expect(queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
  await vi.waitFor(() => {
    expect(container.querySelector('[contenteditable="false"]'))
      .toBeInTheDocument();
  });
});

function callAction(
  fields: Record<string, string>,
  user: typeof userFixture | null = userFixture,
) {
  const formData = new FormData();
  formData.set('csrf', 'test-token');

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  const request = new Request(`http://localhost${documentUrl}`, {
    method: 'POST',
    body: formData,
  });
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, user);

  return action({
    request,
    url: new URL(request.url),
    pattern: '/doc/:id',
    params: { id: documentFixture.id },
    context,
  } as Route.ActionArgs);
}

test('invites the address for the signed in user', async () => {
  inviteCollaboratorMock
    .mockResolvedValue([null, { email: 'grace@example.com' }]);

  const result = await callAction({
    email: 'grace@example.com',
    access: 'view',
  });

  expect(inviteCollaboratorMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    user: userFixture,
    email: 'grace@example.com',
    access: 'view',
  });
  expect(result).toStrictEqual({
    ok: true,
    invited: { email: 'grace@example.com' },
  });
});

test('returns the form state for an address that is not one', async () => {
  const result = await callAction({ email: 'grace', access: 'view' });

  expect(result).toMatchObject({
    values: { email: 'grace', access: 'view' },
  });
  expect(inviteCollaboratorMock).not.toHaveBeenCalled();
});

test('puts a refused invite on the address field', async () => {
  inviteCollaboratorMock
    .mockResolvedValue([InviteCollaboratorError.AlreadyInvited]);

  const result = await callAction({
    email: 'grace@example.com',
    access: 'edit',
  });

  expect(result).toMatchObject({
    errorMap: {
      onServer: {
        fields: {
          email: { message: documentInviteCopies.alreadyInvited },
        },
      },
    },
  });
});

test('responds with 403 when the service denies the user', async () => {
  inviteCollaboratorMock
    .mockResolvedValue([InviteCollaboratorError.PermissionDenied]);

  await expect(callAction({ email: 'grace@example.com', access: 'edit' }))
    .rejects.toMatchObject({ init: { status: 403 } });
});

test('responds with 403 for an anonymous visitor', async () => {
  await expect(callAction({ email: 'grace@example.com', access: 'edit' }, null))
    .rejects.toMatchObject({ init: { status: 403 } });
  expect(inviteCollaboratorMock).not.toHaveBeenCalled();
});
