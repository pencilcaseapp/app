import { describe, it, expect } from 'vitest';
import { createOtp, expireOtp, getOtp, getValidOtp, markOtpAsUsed } from './otp';
import { createUserFixture } from '~/test/fixtures/user';
import { createExpiredOtpFixture, createOtpFixture, createUsedOtpFixture } from '~/test/fixtures/otp';
import { faker } from '@faker-js/faker';

describe('createOtp', () => {
  it('creates an otp', async () => {
    const userFixture = await createUserFixture();

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
    const userFixture = await createUserFixture();

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
    const userFixture = await createUserFixture();
    const otpFixture = await createOtpFixture(userFixture.id);
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
    const userFixture = await createUserFixture();
    const otpFixture = await createOtpFixture(userFixture.id);
    const otp = await getValidOtp(otpFixture.id);

    expect(otp).toStrictEqual(otpFixture);
  });

  it('returns undefined if otp is expired', async () => {
    const userFixture = await createUserFixture();
    const otpFixture = await createExpiredOtpFixture(userFixture.id);
    const otp = await getValidOtp(otpFixture.id);

    expect(otp).toBeUndefined();
  });

  it('returns undefined if otp is used', async () => {
    const userFixture = await createUserFixture();
    const otpFixture = await createUsedOtpFixture(userFixture.id);
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
    const userFixture = await createUserFixture();
    const otpFixture = await createOtpFixture(userFixture.id);
    const expiredOtp = await expireOtp(otpFixture.id);

    // OTP should be expired immediately
    expect(
      expiredOtp.expiresAt.getTime(),
    ).toBeLessThanOrEqual(new Date().getTime());
  });
});

describe('markOtpAsUsed', () => {
  it('marks an otp as used', async () => {
    const userFixture = await createUserFixture();
    const otpFixture = await createOtpFixture(userFixture.id);
    const usedOtp = await markOtpAsUsed(otpFixture.id);

    // OTP should be marked as used immediately
    expect(
      usedOtp.usedAt?.getTime(),
    ).toBeLessThanOrEqual(new Date().getTime());
  });
});
