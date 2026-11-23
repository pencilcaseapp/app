import {
  eq,
  inArray,
  lt,
  sql,
  type InferSelectModel,
} from 'drizzle-orm';
import { db, type Executor } from '~/db';
import { creemWebhookEvents } from '~/db/schema';

export type CreemWebhookEventRecord
  = InferSelectModel<typeof creemWebhookEvents>;

/**
 * Records the event under Creem's event id and returns `undefined` when it
 * was already recorded — that is what makes redeliveries detectable.
 */
export async function recordWebhookEvent(input: {
  id: string;
  eventType: string;
  payload: unknown;
}) {
  const [event] = await db
    .insert(creemWebhookEvents)
    .values(input)
    .onConflictDoNothing({ target: creemWebhookEvents.id })
    .returning();

  return event;
}

export async function getWebhookEvent(id: string) {
  return db.query.creemWebhookEvents.findFirst({
    where: {
      id,
    },
  });
}

export async function markWebhookEventProcessed(id: string) {
  const [event] = await db
    .update(creemWebhookEvents)
    .set({ processedAt: new Date() })
    .where(eq(creemWebhookEvents.id, id))
    .returning();

  return event;
}

const DELETE_BATCH_SIZE = 1000;

export async function deleteWebhookEventsReceivedBefore(before: Date) {
  let deletedCount = 0;

  while (true) {
    const batch = db
      .select({ id: creemWebhookEvents.id })
      .from(creemWebhookEvents)
      .where(lt(creemWebhookEvents.receivedAt, before))
      .limit(DELETE_BATCH_SIZE);

    const deleted = await db
      .delete(creemWebhookEvents)
      .where(inArray(creemWebhookEvents.id, batch))
      .returning({ id: creemWebhookEvents.id });

    deletedCount += deleted.length;

    if (deleted.length < DELETE_BATCH_SIZE) {
      return deletedCount;
    }
  }
}

/**
 * Deletes the events that carry any of the given values anywhere in their
 * payload, matched as whole values rather than as text, for the purge of a
 * deleted account: its user id (the checkout metadata), its Creem
 * customer ids and its address.
 */
export async function deleteWebhookEventsMentioning(
  values: string[],
  executor: Executor = db,
) {
  if (values.length === 0) {
    return 0;
  }

  const deleted = await executor
    .delete(creemWebhookEvents)
    .where(sql`jsonb_path_exists(
      ${creemWebhookEvents.payload},
      '$.** ? (@ == $values[*])',
      jsonb_build_object('values', ${JSON.stringify(values)}::jsonb)
    )`)
    .returning({ id: creemWebhookEvents.id });

  return deleted.length;
}
