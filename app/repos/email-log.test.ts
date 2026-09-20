import { describe, expect, it } from 'vitest';
import { faker } from '@faker-js/faker';
import { EmailLogStatus, EmailTemplate } from '~/constants/email';
import { createTestUser } from '~/test/data-factories/user';
import {
  claimEmailLog,
  getEmailLog,
  getEmailLogByIdempotencyKey,
  markEmailLogFailed,
  markEmailLogSent,
  markEmailLogSkipped,
} from './email-log';

function logInput(overrides: Partial<{ userId: string }> = {}) {
  return {
    idempotencyKey: `${EmailTemplate.OtpCode}:${faker.string.uuid()}`,
    template: EmailTemplate.OtpCode,
    email: faker.internet.email(),
    subject: 'Your code',
    ...overrides,
  };
}

describe('claimEmailLog', () => {
  it('claims a key that is free', async () => {
    const user = await createTestUser();
    const input = logInput({ userId: user.id });

    const log = await claimEmailLog(input);

    expect(log).toMatchObject({
      idempotencyKey: input.idempotencyKey,
      template: EmailTemplate.OtpCode,
      email: input.email,
      subject: 'Your code',
      status: EmailLogStatus.Pending,
      userId: user.id,
      providerMessageId: null,
      sentAt: null,
    });
  });

  it('returns undefined when the key is already claimed', async () => {
    const input = logInput();
    await claimEmailLog(input);

    expect(await claimEmailLog(input)).toBeUndefined();
  });

  it('returns undefined when the key was already sent', async () => {
    const input = logInput();
    const claimed = await claimEmailLog(input);
    await markEmailLogSent({ id: claimed!.id, providerMessageId: 'msg_1' });

    expect(await claimEmailLog(input)).toBeUndefined();
  });

  it('claims a key again when the send before it failed', async () => {
    const input = logInput();
    const claimed = await claimEmailLog(input);
    await markEmailLogFailed({ id: claimed!.id, error: 'Boom' });

    const log = await claimEmailLog(input);

    expect(log?.id).toBe(claimed!.id);
    expect(log?.status).toBe(EmailLogStatus.Pending);
    expect(log?.error).toBeNull();
  });
});

describe('getEmailLog', () => {
  it('reads a log back', async () => {
    const claimed = await claimEmailLog(logInput());

    expect((await getEmailLog(claimed!.id))?.id).toBe(claimed!.id);
  });

  it('returns undefined for an id that is not a UUID', async () => {
    expect(await getEmailLog('not-a-uuid')).toBeUndefined();
  });
});

describe('getEmailLogByIdempotencyKey', () => {
  it('finds the log of a key', async () => {
    const input = logInput();
    await claimEmailLog(input);

    const log = await getEmailLogByIdempotencyKey(input.idempotencyKey);

    expect(log?.idempotencyKey).toBe(input.idempotencyKey);
  });

  it('returns undefined for a key nothing was sent under', async () => {
    expect(await getEmailLogByIdempotencyKey('nope')).toBeUndefined();
  });
});

describe('markEmailLogSent', () => {
  it('stores the provider message id and the send time', async () => {
    const claimed = await claimEmailLog(logInput());

    const log = await markEmailLogSent({
      id: claimed!.id,
      providerMessageId: 'msg_123',
    });

    expect(log?.status).toBe(EmailLogStatus.Sent);
    expect(log?.providerMessageId).toBe('msg_123');
    expect(log?.sentAt).toBeInstanceOf(Date);
  });
});

describe('markEmailLogSkipped', () => {
  it('records why nothing was sent', async () => {
    const claimed = await claimEmailLog(logInput());

    const log = await markEmailLogSkipped({
      id: claimed!.id,
      reason: 'Test address',
    });

    expect(log?.status).toBe(EmailLogStatus.Skipped);
    expect(log?.error).toBe('Test address');
    expect(log?.sentAt).toBeNull();
  });
});

describe('markEmailLogFailed', () => {
  it('records the error', async () => {
    const claimed = await claimEmailLog(logInput());

    const log = await markEmailLogFailed({ id: claimed!.id, error: 'Boom' });

    expect(log?.status).toBe(EmailLogStatus.Failed);
    expect(log?.error).toBe('Boom');
  });
});
