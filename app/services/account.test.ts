// @vitest-environment node

import { faker } from '@faker-js/faker';
import { eq, inArray, or } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getObjectStream, putObject } from '~/clients/storage';
import { db } from '~/db';
import {
  documentAssets,
  documentCollaborators,
  documentReports,
  documents,
  emailChangeRequests,
  emailLogs,
  otps,
  sessions,
  subscriptions,
  users,
} from '~/db/schema';
import { getDailyStat, getUtcDate } from '~/repos/daily-stat';
import { getUser } from '~/repos/user';
import { getCanonicalEmail } from '~/utils/email';
import { createTestAsset } from '~/test/data-factories/document-asset';
import {
  connectDocumentCollaborator,
  createDeletedDocument,
  createDocumentWithTitle,
  createSharedDocument,
  inviteDocumentCollaborator,
} from '~/test/data-factories/document';
import { createDocumentReport } from '~/test/data-factories/document-report';
import { createTestEmailChangeRequest } from '~/test/data-factories/email-change-request';
import { createValidOtp } from '~/test/data-factories/otp';
import { createTestSubscription } from '~/test/data-factories/subscription';
import { createTestUser, createValidUserSession } from '~/test/data-factories/user';
import {
  deleteAccount,
  DeleteAccountError,
  purgeDeletedAccounts,
  sendAccountDeletedEmail,
} from './account';

const enqueueJobMock = vi.fn();
vi.mock('~/jobs/queue', () => ({
  enqueueJob: (...args: unknown[]) => enqueueJobMock(...args),
}));

const cancelRenewingSubscriptionsMock = vi.fn(() => Promise.resolve(true));
vi.mock('./subscription', () => ({
  cancelRenewingSubscriptions: (...args: unknown[]) =>
    cancelRenewingSubscriptionsMock(...args as []),
}));

const sendEmailAccountDeletedMock = vi.fn();
vi.mock('./email-templates', () => ({
  sendEmailAccountDeleted: (...args: unknown[]) =>
    sendEmailAccountDeletedMock(...args),
}));

const closeDocumentConnectionsMock = vi.fn();
vi.mock('~/live/connections', () => ({
  closeDocumentConnections: (...args: unknown[]) =>
    closeDocumentConnectionsMock(...args),
}));

const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.clearAllMocks();
});

async function deleteUserAt(userId: string, deletedAt: Date) {
  await db.update(users).set({ deletedAt }).where(eq(users.id, userId));
}

async function putAssetFile(storageKey: string) {
  await putObject({
    key: storageKey,
    body: new TextEncoder().encode('image'),
    contentType: 'image/webp',
  });
}

describe('deleteAccount', () => {
  it('marks the account deleted and signs it out everywhere', async () => {
    const user = await createTestUser();
    const first = await createValidUserSession(user.id);
    const second = await createValidUserSession(user.id);

    const [error, result] = await deleteAccount(user);

    expect(error).toBeNull();
    const stored = await getUser(user.id);
    expect(stored?.deletedAt).toBeInstanceOf(Date);
    expect(result?.restoreUntil.getTime())
      .toBe(stored!.deletedAt!.getTime() + 30 * DAY);

    const remaining = await db.select().from(sessions)
      .where(inArray(sessions.id, [first.id, second.id]));
    for (const session of remaining) {
      expect(session.expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });

  it('cancels the subscription before anything else', async () => {
    const user = await createTestUser();

    await deleteAccount(user);

    expect(cancelRenewingSubscriptionsMock).toHaveBeenCalledWith(user);
  });

  it('keeps the account when the subscription cannot be cancelled', async () => {
    const user = await createTestUser();
    const session = await createValidUserSession(user.id);
    cancelRenewingSubscriptionsMock.mockResolvedValueOnce(false);

    const [error] = await deleteAccount(user);

    expect(error).toBe(DeleteAccountError.CancelSubscriptionFailed);
    expect((await getUser(user.id))?.deletedAt).toBeNull();
    const [stored] = await db.select().from(sessions)
      .where(eq(sessions.id, session.id));
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(sendEmailAccountDeletedMock).not.toHaveBeenCalled();
  });

  it('closes the connections to its documents and its own elsewhere', async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    const own = await createSharedDocument(user.id);
    const theirs = await createSharedDocument(other.id);
    await connectDocumentCollaborator(theirs.id, user.id);

    await deleteAccount(user);

    expect(closeDocumentConnectionsMock)
      .toHaveBeenCalledWith({ documentId: own.id });
    expect(closeDocumentConnectionsMock)
      .toHaveBeenCalledWith({ documentId: theirs.id, userId: user.id });
  });

  it('hands the confirmation e-mail to a background job', async () => {
    const user = await createTestUser();

    await deleteAccount(user);

    const { deletedAt } = (await getUser(user.id))!;
    expect(enqueueJobMock).toHaveBeenCalledWith('send-account-deleted-email', {
      userId: user.id,
      deletedAt: deletedAt!.toISOString(),
    });
  });

  it('does not delete or write twice', async () => {
    const user = await createTestUser();
    await deleteAccount(user);
    const { deletedAt } = (await getUser(user.id))!;

    const [error] = await deleteAccount({ ...user, deletedAt });

    expect(error).toBeNull();
    expect((await getUser(user.id))?.deletedAt).toStrictEqual(deletedAt);
    expect(enqueueJobMock).toHaveBeenCalledTimes(1);
  });
});

describe('sendAccountDeletedEmail', () => {
  it('confirms the deletion with the last day to restore', async () => {
    const user = await createTestUser();
    const deletedAt = new Date('2026-11-23T17:00:00Z');
    await deleteUserAt(user.id, deletedAt);

    await sendAccountDeletedEmail(user.id, deletedAt);

    expect(sendEmailAccountDeletedMock).toHaveBeenCalledWith({
      to: { email: user.email, name: user.name },
      userId: user.id,
      deletedAt,
      restoreUntil: '23 December 2026',
    });
  });

  it('skips an account restored or deleted again since', async () => {
    const user = await createTestUser();
    const deletedAt = new Date('2026-11-23T17:00:00Z');

    await sendAccountDeletedEmail(user.id, deletedAt);
    await deleteUserAt(user.id, new Date('2026-11-24T08:00:00Z'));
    await sendAccountDeletedEmail(user.id, deletedAt);

    expect(sendEmailAccountDeletedMock).not.toHaveBeenCalled();
  });

  it('throws when the send fails, so the job retries', async () => {
    const user = await createTestUser();
    const deletedAt = new Date('2026-11-23T17:00:00Z');
    await deleteUserAt(user.id, deletedAt);
    sendEmailAccountDeletedMock.mockRejectedValueOnce(new Error('down'));

    await expect(sendAccountDeletedEmail(user.id, deletedAt))
      .rejects.toThrow('down');
  });
});

describe('purgeDeletedAccounts', () => {
  const before = new Date(Date.now() - 30 * DAY);
  const longAgo = new Date(Date.now() - 31 * DAY);

  it('removes everything tied to the account', async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    const invited = await createTestUser();

    // Its own documents, a shared and a deleted one, with images.
    const shared = await createSharedDocument(user.id);
    const deleted = await createDeletedDocument(user.id);
    const sharedAsset = await createTestAsset(shared.id, user.id);
    const deletedAsset = await createTestAsset(deleted.id, other.id);
    await putAssetFile(sharedAsset.storageKey);
    await putAssetFile(deletedAsset.storageKey);
    await connectDocumentCollaborator(shared.id, other.id);
    await inviteDocumentCollaborator(shared.id, invited.email, {
      userId: invited.id,
      accepted: true,
    });

    // Its place in the documents of others.
    const theirs = await createDocumentWithTitle(other.id);
    await connectDocumentCollaborator(theirs.id, user.id);
    const invitedTo = await createDocumentWithTitle(other.id);
    await inviteDocumentCollaborator(invitedTo.id, user.email);
    const uploadedThere = await createTestAsset(theirs.id, user.id);

    // Its sign-in, e-mail and payment records.
    await createValidUserSession(user.id);
    await createValidOtp(user.id, user.email);
    await db.insert(otps).values({
      email: user.email,
      canonicalEmail: getCanonicalEmail(user.email),
      codeHash: 'hash',
    });
    await createTestEmailChangeRequest(user.id);
    await db.insert(emailLogs).values([
      {
        idempotencyKey: `test:${faker.string.uuid()}`,
        template: 'otp-code',
        email: user.email,
        subject: 'Code',
        status: 'sent',
      },
      {
        idempotencyKey: `test:${faker.string.uuid()}`,
        template: 'document-report',
        email: 'inbox@pencilcase.app',
        subject: 'Report',
        status: 'sent',
        userId: user.id,
      },
    ]);
    const subscription = await createTestSubscription(user.id, {
      status: 'scheduled_cancel',
    });
    await db.update(users)
      .set({ creemCustomerId: subscription.creemCustomerId })
      .where(eq(users.id, user.id));

    // A report it sent about somebody else's document.
    const report = await createDocumentReport({
      documentId: theirs.id,
      userId: user.id,
    });

    await deleteUserAt(user.id, longAgo);

    expect(await purgeDeletedAccounts(before)).toBeGreaterThanOrEqual(1);

    expect(await getUser(user.id)).toBeUndefined();
    expect(await db.select().from(documents)
      .where(inArray(documents.id, [shared.id, deleted.id]))).toEqual([]);
    expect(await db.select().from(documentAssets)
      .where(inArray(documentAssets.id, [sharedAsset.id, deletedAsset.id])))
      .toEqual([]);
    expect(await getObjectStream(sharedAsset.storageKey)).toBeUndefined();
    expect(await getObjectStream(deletedAsset.storageKey)).toBeUndefined();
    expect(await db.select().from(documentCollaborators).where(or(
      inArray(documentCollaborators.documentId, [shared.id, deleted.id]),
      eq(documentCollaborators.userId, user.id),
      eq(documentCollaborators.email, user.email),
    ))).toEqual([]);
    expect(await db.select().from(sessions)
      .where(eq(sessions.userId, user.id))).toEqual([]);
    expect(await db.select().from(otps).where(or(
      eq(otps.userId, user.id),
      eq(otps.email, user.email),
    ))).toEqual([]);
    expect(await db.select().from(emailChangeRequests)
      .where(eq(emailChangeRequests.userId, user.id))).toEqual([]);
    expect(await db.select().from(emailLogs).where(or(
      eq(emailLogs.userId, user.id),
      eq(emailLogs.email, user.email),
    ))).toEqual([]);
    expect(await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, user.id))).toEqual([]);

    // What belongs to the others stays, without the account in it.
    expect(await db.select({ id: documents.id }).from(documents)
      .where(inArray(documents.id, [theirs.id, invitedTo.id])))
      .toHaveLength(2);
    const [kept] = await db.select().from(documentAssets)
      .where(eq(documentAssets.id, uploadedThere.id));
    expect(kept.userId).toBeNull();
    const [keptReport] = await db.select().from(documentReports)
      .where(eq(documentReports.id, report.id));
    expect(keptReport.userId).toBeNull();
    expect(await getUser(other.id)).toBeDefined();
  });

  it('counts the account and its documents in the daily stats', async () => {
    const user = await createTestUser();
    await createDocumentWithTitle(user.id);
    await createDeletedDocument(user.id);
    await deleteUserAt(user.id, longAgo);
    const stat = await getDailyStat(getUtcDate());

    await purgeDeletedAccounts(before);

    const after = await getDailyStat(getUtcDate());
    expect(after!.accountsDeleted).toBe((stat?.accountsDeleted ?? 0) + 1);
    expect(after!.documentsDeleted).toBe((stat?.documentsDeleted ?? 0) + 2);
  });

  it('leaves an account deleted within the retention period', async () => {
    const user = await createTestUser();
    await deleteUserAt(user.id, new Date(Date.now() - 29 * DAY));

    await purgeDeletedAccounts(before);

    expect(await getUser(user.id)).toBeDefined();
  });

  it('leaves an account that was never deleted', async () => {
    const user = await createTestUser();

    await purgeDeletedAccounts(before);

    expect(await getUser(user.id)).toBeDefined();
  });

  it('leaves an account for the next run while Creem cannot cancel', async () => {
    const user = await createTestUser();
    await createDocumentWithTitle(user.id);
    await deleteUserAt(user.id, longAgo);
    cancelRenewingSubscriptionsMock.mockImplementation(
      (async (account: { id: string }) => account.id !== user.id) as never,
    );

    await purgeDeletedAccounts(before);

    expect(await getUser(user.id)).toBeDefined();
    cancelRenewingSubscriptionsMock.mockImplementation(async () => true);
  });
});
