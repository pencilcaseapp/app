import { eq, type InferSelectModel } from 'drizzle-orm';
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
