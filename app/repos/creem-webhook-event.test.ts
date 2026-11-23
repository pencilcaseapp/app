import { describe, expect, it } from 'vitest';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { creemWebhookEvents } from '~/db/schema';
import {
  deleteWebhookEventsReceivedBefore,
  getWebhookEvent,
  markWebhookEventProcessed,
  recordWebhookEvent,
} from './creem-webhook-event';

function eventInput() {
  return {
    id: `evt_${faker.string.alphanumeric(22)}`,
    eventType: 'subscription.paid',
    payload: { object: { id: 'sub_123' } },
  };
}

describe('recordWebhookEvent', () => {
  it('records an event', async () => {
    const input = eventInput();

    const event = await recordWebhookEvent(input);

    expect(event).toStrictEqual({
      id: input.id,
      eventType: 'subscription.paid',
      payload: { object: { id: 'sub_123' } },
      receivedAt: expect.any(Date),
      processedAt: null,
    });
  });

  it('returns undefined when the event was already recorded', async () => {
    const input = eventInput();
    await recordWebhookEvent(input);

    const event = await recordWebhookEvent(input);

    expect(event).toBeUndefined();
  });
});

describe('markWebhookEventProcessed', () => {
  it('stamps the processing time', async () => {
    const input = eventInput();
    await recordWebhookEvent(input);

    const event = await markWebhookEventProcessed(input.id);

    expect(event?.processedAt).toBeInstanceOf(Date);
  });
});

describe('getWebhookEvent', () => {
  it('returns a recorded event', async () => {
    const input = eventInput();
    await recordWebhookEvent(input);

    const event = await getWebhookEvent(input.id);

    expect(event?.eventType).toBe('subscription.paid');
  });

  it('returns undefined for an unknown id', async () => {
    const event = await getWebhookEvent('evt_unknown');

    expect(event).toBeUndefined();
  });
});

// The cutoffs sit days in the past so these tests only ever see their own
// rows — other test files record events received around now, in parallel.
describe('deleteWebhookEventsReceivedBefore', () => {
  const days = 24 * 60 * 60 * 1000;

  async function recordReceivedAt(receivedAt: Date) {
    const input = eventInput();
    await recordWebhookEvent(input);
    await db
      .update(creemWebhookEvents)
      .set({ receivedAt })
      .where(eq(creemWebhookEvents.id, input.id));

    return input;
  }

  it('deletes events received before the given date', async () => {
    const input = await recordReceivedAt(new Date(Date.now() - 10 * days));

    const deletedCount = await deleteWebhookEventsReceivedBefore(
      new Date(Date.now() - 5 * days),
    );

    expect(deletedCount).toBeGreaterThanOrEqual(1);
    expect(await getWebhookEvent(input.id)).toBeUndefined();
  });

  it('keeps events received after the given date', async () => {
    const input = await recordReceivedAt(new Date(Date.now() - 6 * days));

    await deleteWebhookEventsReceivedBefore(new Date(Date.now() - 7 * days));

    expect(await getWebhookEvent(input.id)).toBeDefined();
  });
});
