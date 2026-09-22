// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  changeCollaboratorAccess,
  ChangeCollaboratorAccessError,
  inviteCollaborator,
  InviteCollaboratorError,
  listInvitedCollaborators,
  removeCollaborator,
  RemoveCollaboratorError,
} from './document-invite';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { DOCUMENT_INVITE_LIMIT } from '~/constants/document';
import { EmailTemplate } from '~/constants/email';

const getDocumentForViewerMock = vi.fn();
const getInvitedCollaboratorsMock = vi.fn();
const insertInviteMock = vi.fn();
const setCollaboratorAccessMock = vi.fn();
const deleteCollaboratorMock = vi.fn();
vi.mock('~/repos/document', () => ({
  getDocumentForViewer: (...args: unknown[]) =>
    getDocumentForViewerMock(...args),
  getInvitedCollaborators: (...args: unknown[]) =>
    getInvitedCollaboratorsMock(...args),
  inviteCollaborator: (...args: unknown[]) => insertInviteMock(...args),
  setCollaboratorAccess: (...args: unknown[]) =>
    setCollaboratorAccessMock(...args),
  removeCollaborator: (...args: unknown[]) => deleteCollaboratorMock(...args),
}));

const getUserByEmailMock = vi.fn();
vi.mock('~/repos/user', () => ({
  getUserByEmail: (...args: unknown[]) => getUserByEmailMock(...args),
}));

const countEmailLogsByUserMock = vi.fn();
vi.mock('~/repos/email-log', () => ({
  countEmailLogsByUser: (...args: unknown[]) =>
    countEmailLogsByUserMock(...args),
}));

const sendEmailDocumentInviteMock = vi.fn();
vi.mock('./email-templates', () => ({
  sendEmailDocumentInvite: (...args: unknown[]) =>
    sendEmailDocumentInviteMock(...args),
}));

const closeDocumentConnectionsMock = vi.fn();
vi.mock('~/live/connections', () => ({
  closeDocumentConnections: (...args: unknown[]) =>
    closeDocumentConnectionsMock(...args),
}));

const owner = { ...userFixture, hasSubscription: true };
const otherUserId = 'e6d9c8f1-0000-4000-8000-000000000000';
const collaboratorId = 'a1b2c3d4-0000-4000-8000-000000000000';
const inviteId = 'b2c3d4e5-0000-4000-8000-000000000000';

function ownedDocument(overrides?: Partial<{
  userId: string;
  deletedAt: Date | null;
}>) {
  return {
    id: documentFixture.id,
    title: documentFixture.title,
    shared: false,
    linkAccess: 'view',
    userId: owner.id,
    deletedAt: null,
    collaborator: null,
    ...overrides,
  };
}

function invite(email: string) {
  return inviteCollaborator({
    documentId: documentFixture.id,
    user: owner,
    email,
    access: 'edit',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getDocumentForViewerMock.mockResolvedValue(ownedDocument());
  getUserByEmailMock.mockResolvedValue(undefined);
  countEmailLogsByUserMock.mockResolvedValue(0);
  insertInviteMock.mockResolvedValue({ id: inviteId });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('listInvitedCollaborators', () => {
  it('marks an invite pending until it was accepted', async () => {
    getInvitedCollaboratorsMock.mockResolvedValue([
      {
        id: collaboratorId,
        userId: otherUserId,
        email: 'ada@example.com',
        access: 'edit',
        acceptedAt: new Date(),
        name: 'Ada',
      },
      {
        id: inviteId,
        userId: otherUserId,
        email: 'grace@example.com',
        access: 'view',
        acceptedAt: null,
        name: null,
      },
    ]);

    expect(await listInvitedCollaborators(documentFixture.id)).toStrictEqual([
      {
        id: collaboratorId,
        name: 'Ada',
        email: 'ada@example.com',
        access: 'edit',
        pending: false,
      },
      {
        id: inviteId,
        name: null,
        email: 'grace@example.com',
        access: 'view',
        pending: true,
      },
    ]);
  });
});

describe('inviteCollaborator', () => {
  it('records the invite and sends the e-mail keyed by it', async () => {
    const [error, result] = await invite(' Grace@Example.com ');

    expect(error).toBeNull();
    expect(result).toStrictEqual({ email: 'grace@example.com' });
    expect(insertInviteMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      email: 'grace@example.com',
      access: 'edit',
      userId: undefined,
    });
    expect(sendEmailDocumentInviteMock).toHaveBeenCalledWith({
      to: { email: 'grace@example.com' },
      inviteId,
      documentId: documentFixture.id,
      documentTitle: documentFixture.title,
      inviterName: owner.name,
      inviterId: owner.id,
    });
  });

  it('hands the account of the address over when there is one', async () => {
    getUserByEmailMock.mockResolvedValue({ id: otherUserId });

    await invite('grace@example.com');

    expect(getUserByEmailMock).toHaveBeenCalledWith('grace@example.com');
    expect(insertInviteMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: otherUserId }),
    );
  });

  it('names the owner by e-mail when they have no name', async () => {
    await inviteCollaborator({
      documentId: documentFixture.id,
      user: { ...owner, name: null },
      email: 'grace@example.com',
      access: 'view',
    });

    expect(sendEmailDocumentInviteMock).toHaveBeenCalledWith(
      expect.objectContaining({ inviterName: owner.email }),
    );
  });

  it('refuses anybody but the owner', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      ownedDocument({ userId: otherUserId }),
    );

    const [error] = await invite('grace@example.com');

    expect(error).toBe(InviteCollaboratorError.PermissionDenied);
    expect(insertInviteMock).not.toHaveBeenCalled();
  });

  it('refuses a deleted document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      ownedDocument({ deletedAt: new Date() }),
    );

    const [error] = await invite('grace@example.com');

    expect(error).toBe(InviteCollaboratorError.PermissionDenied);
  });

  it('refuses an unknown document', async () => {
    getDocumentForViewerMock.mockResolvedValue(undefined);

    const [error] = await invite('grace@example.com');

    expect(error).toBe(InviteCollaboratorError.PermissionDenied);
  });

  it('needs the paid plan', async () => {
    const [error] = await inviteCollaborator({
      documentId: documentFixture.id,
      user: { ...owner, hasSubscription: false },
      email: 'grace@example.com',
      access: 'edit',
    });

    expect(error).toBe(InviteCollaboratorError.SubscriptionRequired);
    expect(insertInviteMock).not.toHaveBeenCalled();
  });

  it('refuses the owner\'s own address', async () => {
    const [error] = await invite(owner.email.toUpperCase());

    expect(error).toBe(InviteCollaboratorError.Owner);
    expect(insertInviteMock).not.toHaveBeenCalled();
  });

  it('refuses an address that is invited already', async () => {
    insertInviteMock.mockResolvedValue(undefined);

    const [error] = await invite('grace@example.com');

    expect(error).toBe(InviteCollaboratorError.AlreadyInvited);
    expect(sendEmailDocumentInviteMock).not.toHaveBeenCalled();
  });

  it('counts the invite e-mails the owner sent in the last day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-22T12:00:00Z'));
    countEmailLogsByUserMock.mockResolvedValue(DOCUMENT_INVITE_LIMIT - 1);

    const [error] = await invite('grace@example.com');

    expect(error).toBeNull();
    expect(countEmailLogsByUserMock).toHaveBeenCalledWith({
      userId: owner.id,
      template: EmailTemplate.DocumentInvite,
      since: new Date('2026-09-21T12:00:00Z'),
    });
  });

  it('refuses an invite past the limit', async () => {
    countEmailLogsByUserMock.mockResolvedValue(DOCUMENT_INVITE_LIMIT);

    const [error] = await invite('grace@example.com');

    expect(error).toBe(InviteCollaboratorError.TooManyInvites);
    expect(insertInviteMock).not.toHaveBeenCalled();
    expect(sendEmailDocumentInviteMock).not.toHaveBeenCalled();
  });
});

describe('changeCollaboratorAccess', () => {
  it('changes the access and reconnects the person', async () => {
    setCollaboratorAccessMock.mockResolvedValue({
      id: collaboratorId,
      userId: otherUserId,
      access: 'view',
    });

    const [error, result] = await changeCollaboratorAccess({
      documentId: documentFixture.id,
      userId: owner.id,
      collaboratorId,
      access: 'view',
    });

    expect(error).toBeNull();
    expect(result).toStrictEqual({ access: 'view' });
    expect(setCollaboratorAccessMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      ownerId: owner.id,
      collaboratorId,
      access: 'view',
    });
    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      userId: otherUserId,
    });
  });

  it('has nobody to reconnect for a pending invite', async () => {
    setCollaboratorAccessMock.mockResolvedValue({
      id: collaboratorId,
      userId: null,
      access: 'view',
    });

    const [error] = await changeCollaboratorAccess({
      documentId: documentFixture.id,
      userId: owner.id,
      collaboratorId,
      access: 'view',
    });

    expect(error).toBeNull();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });

  it('denies whoever the update refused', async () => {
    setCollaboratorAccessMock.mockResolvedValue(undefined);

    const [error] = await changeCollaboratorAccess({
      documentId: documentFixture.id,
      userId: otherUserId,
      collaboratorId,
      access: 'view',
    });

    expect(error).toBe(ChangeCollaboratorAccessError.PermissionDenied);
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });
});

describe('removeCollaborator', () => {
  it('deletes the row and closes the person\'s connections', async () => {
    deleteCollaboratorMock.mockResolvedValue({
      id: collaboratorId,
      userId: otherUserId,
    });

    const [error, result] = await removeCollaborator({
      documentId: documentFixture.id,
      userId: owner.id,
      collaboratorId,
    });

    expect(error).toBeNull();
    expect(result).toStrictEqual({ id: collaboratorId });
    expect(deleteCollaboratorMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      ownerId: owner.id,
      collaboratorId,
    });
    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      userId: otherUserId,
    });
  });

  it('has nobody to disconnect for a pending invite', async () => {
    deleteCollaboratorMock.mockResolvedValue({
      id: collaboratorId,
      userId: null,
    });

    const [error] = await removeCollaborator({
      documentId: documentFixture.id,
      userId: owner.id,
      collaboratorId,
    });

    expect(error).toBeNull();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });

  it('denies whoever the delete refused', async () => {
    deleteCollaboratorMock.mockResolvedValue(undefined);

    const [error] = await removeCollaborator({
      documentId: documentFixture.id,
      userId: otherUserId,
      collaboratorId,
    });

    expect(error).toBe(RemoveCollaboratorError.PermissionDenied);
  });
});
