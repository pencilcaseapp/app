import { deleteObjects } from '~/clients/storage';
import { DELETED_ACCOUNT_RETENTION_MS } from '~/constants/account';
import { transaction } from '~/db';
import { enqueueJob } from '~/jobs/queue';
import { incrementDailyStat } from '~/repos/daily-stat';
import { deleteUserEmailChangeRequests } from '~/repos/email-change-request';
import { deleteUserEmailLogs } from '~/repos/email-log';
import { deleteUserOtps } from '~/repos/otp';
import { deleteUserSubscriptions } from '~/repos/subscription';
import {
  expireAllUserSessions,
  getUser,
  getUserIdsDeletedBefore,
  hardDeleteUser,
  lockUserDeletedBefore,
  markUserDeleted,
  type User,
} from '~/repos/user';
import { formatLongDate } from '~/utils/date';
import { closeAccountConnections, deleteAccountDocuments } from './document';
import { sendEmailAccountDeleted } from './email-templates';
import { cancelRenewingSubscriptions } from './subscription';

/** The last moment signing in restores an account deleted at `deletedAt`. */
export function getAccountRestoreDeadline(deletedAt: Date) {
  return new Date(deletedAt.getTime() + DELETED_ACCOUNT_RETENTION_MS);
}

export enum DeleteAccountError {
  CancelSubscriptionFailed,
}

export type DeleteAccountResult
  = [DeleteAccountError] | [null, { restoreUntil: Date }];

/**
 * Deletes the account the user asked to delete: the PRO subscription is
 * cancelled at the end of its paid period first, because an account Creem
 * could still charge must not go, then the account is marked deleted and
 * signed out everywhere in one transaction. Its live connections close
 * after the commit, which is when its documents are gone for everybody,
 * and the confirmation e-mail is handed to a background job last
 * (`sendAccountDeletedEmail`), which retries it with backoff: the
 * deletion stands whether or not it arrives. Signing in again before
 * `restoreUntil` takes it back (`verifyMagicCode`), after that
 * `purgeDeletedAccounts` removes it.
 */
export async function deleteAccount(user: User): Promise<DeleteAccountResult> {
  if (!await cancelRenewingSubscriptions(user)) {
    return [DeleteAccountError.CancelSubscriptionFailed];
  }

  const deletedAt = await transaction(async (tx) => {
    const markedAt = await markUserDeleted(user.id, tx);
    await expireAllUserSessions(user.id, tx);

    return markedAt;
  });

  // Deleted twice, from two devices at once: the first one counts.
  if (!deletedAt) {
    return [null, {
      restoreUntil: getAccountRestoreDeadline(user.deletedAt ?? new Date()),
    }];
  }

  await closeAccountConnections(user.id);

  await enqueueJob('send-account-deleted-email', {
    userId: user.id,
    deletedAt: deletedAt.toISOString(),
  });

  return [null, { restoreUntil: getAccountRestoreDeadline(deletedAt) }];
}

/**
 * Sends the confirmation of the deletion stamped at `deletedAt`, unless
 * the account has been restored (or deleted again, which queued its own)
 * since. Throws when the send fails, so the job retries it.
 */
export async function sendAccountDeletedEmail(
  userId: string,
  deletedAt: Date,
) {
  const user = await getUser(userId);

  if (user?.deletedAt?.getTime() !== deletedAt.getTime()) {
    return;
  }

  await sendEmailAccountDeleted({
    to: { email: user.email, name: user.name ?? undefined },
    userId: user.id,
    deletedAt,
    restoreUntil: formatLongDate(getAccountRestoreDeadline(deletedAt)),
  });
}

/**
 * Removes every account deleted before the given date along with
 * everything tied to it, one account per transaction:
 *
 * - its documents, deleted or not, with their images, invites and the
 *   connections others made to them, and its own invites and connections
 *   to the documents of others (`deleteAccountDocuments`),
 * - its sessions, codes, e-mail change requests and e-mail logs, the
 *   codes and logs sent to its address included,
 * - its subscriptions (the stored Creem events go after 30 days with
 *   all the others),
 * - and the user row, which clears its name from the reports it sent
 *   (the reports themselves are kept for their retention period).
 *
 * The account row is locked first, so signing in, which restores it,
 * waits for the purge or wins before it. A renewing subscription that is
 * still there is cancelled before anything is removed, and the account is
 * left for the next run if Creem cannot be reached. The files of its
 * images go last, right before the commit, like `purgeDeletedDocuments`
 * does, and the daily stats after them.
 */
export async function purgeDeletedAccounts(before: Date) {
  let purgedCount = 0;

  for (const id of await getUserIdsDeletedBefore(before)) {
    if (await purgeDeletedAccount(id, before)) {
      purgedCount += 1;
    }
  }

  return purgedCount;
}

async function purgeDeletedAccount(id: string, before: Date) {
  if (!await cancelRenewingSubscriptions({ id })) {
    return false;
  }

  return transaction(async (tx) => {
    const user = await lockUserDeletedBefore(id, before, tx);

    if (!user) {
      return false;
    }

    const documents = await deleteAccountDocuments(user, tx);

    await deleteUserOtps({
      userId: user.id,
      email: user.email,
    }, tx);
    await deleteUserEmailChangeRequests(user.id, tx);
    await deleteUserEmailLogs({ userId: user.id, email: user.email }, tx);

    await deleteUserSubscriptions(user.id, tx);

    await hardDeleteUser(user.id, tx);

    await deleteObjects(documents.storageKeys);
    await incrementDailyStat('accountsDeleted', 1, tx);
    await incrementDailyStat('documentsDeleted', documents.deletedCount, tx);

    return true;
  });
}
