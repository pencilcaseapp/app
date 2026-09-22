import { and, eq, gt, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { emailLogs } from '~/db/schema';
import { EmailLogStatus, type EmailTemplate } from '~/constants/email';

export type EmailLog = InferSelectModel<typeof emailLogs>;

/**
 * Takes the idempotency key for one send and returns the log row, or
 * `undefined` when the key is already taken — that is what blocks a
 * duplicate. A previous attempt that failed before it reached the
 * provider is claimed again; anything else keeps the row it has. One
 * statement, so two callers racing for the same key cannot both win.
 */
export async function claimEmailLog(input: {
  idempotencyKey: string;
  template: string;
  email: string;
  subject: string;
  userId?: string;
}) {
  const [log] = await db
    .insert(emailLogs)
    .values({ ...input, status: EmailLogStatus.Pending })
    .onConflictDoUpdate({
      target: emailLogs.idempotencyKey,
      setWhere: eq(emailLogs.status, EmailLogStatus.Failed),
      set: {
        ...input,
        status: EmailLogStatus.Pending,
        error: null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return log;
}

/**
 * How many e-mails of one template the user has caused since a point in
 * time, every status included: a send that was skipped or failed was
 * still asked for, which is what a rate limit counts.
 */
export async function countEmailLogsByUser(input: {
  userId: string;
  template: EmailTemplate;
  since: Date;
}) {
  const { userId, template, since } = input;

  if (!isUuid(userId)) {
    return 0;
  }

  return db.$count(
    emailLogs,
    and(
      eq(emailLogs.userId, userId),
      eq(emailLogs.template, template),
      gt(emailLogs.createdAt, since),
    ),
  );
}

export async function getEmailLog(id: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  return db.query.emailLogs.findFirst({
    where: {
      id,
    },
  });
}

export async function getEmailLogByIdempotencyKey(idempotencyKey: string) {
  return db.query.emailLogs.findFirst({
    where: {
      idempotencyKey,
    },
  });
}

export async function markEmailLogSent(input: {
  id: string;
  providerMessageId?: string;
}) {
  const { id, providerMessageId } = input;

  const [log] = await db
    .update(emailLogs)
    .set({
      status: EmailLogStatus.Sent,
      providerMessageId,
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(emailLogs.id, id))
    .returning();

  return log;
}

export async function markEmailLogSkipped(input: {
  id: string;
  reason: string;
}) {
  const { id, reason } = input;

  const [log] = await db
    .update(emailLogs)
    .set({
      status: EmailLogStatus.Skipped,
      error: reason,
      updatedAt: new Date(),
    })
    .where(eq(emailLogs.id, id))
    .returning();

  return log;
}

export async function markEmailLogFailed(input: {
  id: string;
  error: string;
}) {
  const { id, error } = input;

  const [log] = await db
    .update(emailLogs)
    .set({
      status: EmailLogStatus.Failed,
      error,
      updatedAt: new Date(),
    })
    .where(eq(emailLogs.id, id))
    .returning();

  return log;
}
