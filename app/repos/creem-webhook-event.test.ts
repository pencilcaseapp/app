import { describe, expect, it } from 'vitest';
import { faker } from '@faker-js/faker';
import {
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
