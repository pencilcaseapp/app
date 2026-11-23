import {
  eq,
  inArray,
  lt,
  type InferSelectModel,
} from 'drizzle-orm';
import { db } from '~/db';
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
