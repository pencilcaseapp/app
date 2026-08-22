import { describe, it, expect } from 'vitest';
import { deleteOtpsExpiredBefore, expireAllValidOtps, canRequestNewOtp, createOtp, expireOtp, getOtp, getValidOtp, markOtpAsUsed } from './otp';
import { createTestUser } from '~/test/data-factories/user';
import { createExpiredOtp, createValidOtp, createUsedOtp } from '~/test/data-factories/otp';
import { faker } from '@faker-js/faker';

describe('createOtp', () => {
  it('creates an otp', async () => {
    const userFixture = await createTestUser();

    const otp = await createOtp({
      userId: userFixture.id,
      email: userFixture.email,
      codeHash: 'hashed-code',
    });

    expect(otp).toStrictEqual({
      id: expect.any(String),
      userId: userFixture.id,
      email: userFixture.email,
      codeHash: 'hashed-code',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      expiresAt: expect.any(Date),
      usedAt: null,
    });
  });

  it('creates an otp with correct expiry', async () => {
    const userFixture = await createTestUser();

    const otp = await createOtp({
      userId: userFixture.id,
      email: userFixture.email,
      codeHash: 'hashed-code',
    });

    // OTP should expire 15 minutes after creation
    const expectedExpiresAt = otp.createdAt.getTime() + 15 * 60 * 1000;

    expect(
      otp.expiresAt.getTime(),
    ).toEqual(expectedExpiresAt);
  });
});

describe('getOtp', () => {
  it('returns an otp', async () => {
    const userFixture = await createTestUser();
    const otpFixture = await createValidOtp(userFixture.id);
    const otp = await getOtp(otpFixture.id);

    expect(otp).toStrictEqual(otpFixture);
  });

  it('returns undefined if otp does not exist', async () => {
    const otp = await getOtp(faker.string.uuid());

    expect(otp).toBeUndefined();
  });

  it('returns undefined if id is invalid', async () => {
    const otp = await getOtp('invalid-id');

    expect(otp).toBeUndefined();
  });
});

describe('getValidOtp', () => {
  it('returns a valid otp', async () => {
    const userFixture = await createTestUser();
    const otpFixture = await createValidOtp(userFixture.id);
    const otp = await getValidOtp(otpFixture.id);

    expect(otp).toStrictEqual(otpFixture);
  });

  it('returns undefined if otp is expired', async () => {
    const userFixture = await createTestUser();
    const otpFixture = await createExpiredOtp({ userId: userFixture.id });
    const otp = await getValidOtp(otpFixture.id);

    expect(otp).toBeUndefined();
  });

  it('returns undefined if otp is used', async () => {
    const userFixture = await createTestUser();
    const otpFixture = await createUsedOtp(userFixture.id);
    const otp = await getValidOtp(otpFixture.id);

    expect(otp).toBeUndefined();
  });

  it('returns undefined if id is invalid', async () => {
    const otp = await getValidOtp('invalid-id');

    expect(otp).toBeUndefined();
  });
});

describe('expireOtp', () => {
  it('expires an otp', async () => {
    const userFixture = await createTestUser();
    const otpFixture = await createValidOtp(userFixture.id);
    const expiredOtp = await expireOtp(otpFixture.id);

    // OTP should be expired immediately
    expect(
      expiredOtp.expiresAt.getTime(),
    ).toBeLessThanOrEqual(new Date().getTime());
  });
});

describe('expireAllValidOtps', () => {
  it('expires all valid otps for a given email', async () => {
    const userFixture = await createTestUser();
    const otpFixture1 = await createValidOtp(
      userFixture.id,
      userFixture.email,
    );

    const otpFixture2 = await createValidOtp(
      userFixture.id,
      userFixture.email,
    );

    const otpFixture3 = await createExpiredOtp({
      userId: userFixture.id,
      email: userFixture.email,
    });

    await expireAllValidOtps(userFixture.email);

    const expiredOtp1 = await getOtp(otpFixture1.id);
    const expiredOtp2 = await getOtp(otpFixture2.id);
    const expiredOtp3 = await getOtp(otpFixture3.id);

    expect(
      expiredOtp1?.expiresAt.getTime(),
    ).toBeLessThanOrEqual(new Date().getTime());
    expect(
      expiredOtp2?.expiresAt.getTime(),
    ).toBeLessThanOrEqual(new Date().getTime());
    expect(
      expiredOtp3?.expiresAt.getTime(),
    ).toBe(otpFixture3.expiresAt.getTime());
  });
});

describe('markOtpAsUsed', () => {
  it('marks an otp as used', async () => {
    const userFixture = await createTestUser();
    const otpFixture = await createValidOtp(userFixture.id);
    const usedOtp = await markOtpAsUsed(otpFixture.id);

    // OTP should be marked as used immediately
    expect(
      usedOtp.usedAt?.getTime(),
    ).toBeLessThanOrEqual(new Date().getTime());
  });
});

// The cutoffs sit days in the past so these tests only ever see their own
// rows — other test files create OTPs expiring around now, in parallel.
describe('deleteOtpsExpiredBefore', () => {
  const days = 24 * 60 * 60 * 1000;

  it('deletes otps that expired before the given date', async () => {
    const userFixture = await createTestUser();
    const otpFixture = await createExpiredOtp({
      userId: userFixture.id,
      expiresAt: new Date(Date.now() - 10 * days),
    });

    const deletedCount = await deleteOtpsExpiredBefore(
      new Date(Date.now() - 5 * days),
    );

    expect(deletedCount).toBeGreaterThanOrEqual(1);
    expect(await getOtp(otpFixture.id)).toBeUndefined();
  });

  it('keeps otps that expired after the given date', async () => {
    const userFixture = await createTestUser();
    const otpFixture = await createExpiredOtp({
      userId: userFixture.id,
      expiresAt: new Date(Date.now() - 6 * days),
    });

    await deleteOtpsExpiredBefore(new Date(Date.now() - 7 * days));

    expect(await getOtp(otpFixture.id)).toStrictEqual(otpFixture);
  });
});

describe('canRequestNewOtp', () => {
  it('allows requesting a new OTP if no OTPs have been requested recently', async () => {
    const userFixture = await createTestUser();
    const canRequest = await canRequestNewOtp(userFixture.email);

    expect(canRequest).toBe(true);
  });

  it('allows requesting a new OTP if under the limit', async () => {
    const userFixture = await createTestUser();

    await createValidOtp(userFixture.id, userFixture.email);
    await createValidOtp(userFixture.id, userFixture.email);

    const canRequest = await canRequestNewOtp(userFixture.email);

    expect(canRequest).toBe(true);
  });

  it('prevents requesting a new OTP if over the limit', async () => {
    const userFixture = await createTestUser();

    await createValidOtp(userFixture.id, userFixture.email);
    await createValidOtp(userFixture.id, userFixture.email);
    await createValidOtp(userFixture.id, userFixture.email);

    const canRequest = await canRequestNewOtp(userFixture.email);

    expect(canRequest).toBe(false);
  });
});
