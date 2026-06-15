import { beforeEach, describe, it, expect, vi } from 'vitest';
import { createSessionCookie, initMagicCode, InitMagicCodeError, verifyMagicCode, VerifyMagicCodeError } from './auth';
import { userFixture } from '~/test/fixtures/user';
import argon2 from 'argon2';
import { otpFixture } from '~/test/fixtures/otp';
import { sessionFixture } from '~/test/fixtures/session';

const canRequestNewOtpMock = vi.fn();
const expireAllValidOtpsMock = vi.fn();
const createOtpMock = vi.fn();
const getValidOtpMock = vi.fn();
const markOtpAsUsedMock = vi.fn();
vi.mock('~/repos/otp', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual as object,
    canRequestNewOtp: (...args: unknown[]) => canRequestNewOtpMock(...args),
    expireAllValidOtps: (...args: unknown[]) => expireAllValidOtpsMock(...args),
    createOtp: (...args: unknown[]) => createOtpMock(...args),
    getValidOtp: (...args: unknown[]) => getValidOtpMock(...args),
    markOtpAsUsed: (...args: unknown[]) => markOtpAsUsedMock(...args),
  };
});

vi.mock('~/repos/user', () => ({
  getOrCreateUserByEmail: () => userFixture,
}));

vi.mock('~/repos/session', () => ({
  createSession: () => ({
    ...sessionFixture,
    expiresAt: new Date('2026-06-15T13:39:21.509Z'),
  }),
}));

const sendEmailMagicCodeMock = vi.fn();
vi.mock('./email-templates', () => ({
  sendEmailMagicCode: (...args: unknown[]) => sendEmailMagicCodeMock(...args),
}));

const code = 123456;
const tokenBuffer = Buffer.from('test-token');
vi.mock('node:crypto', () => ({
  default: {
    randomInt: vi.fn(() => code),
    randomBytes: vi.fn(() => tokenBuffer),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('initMagicCode', () => {
  describe('when the user cannot request a new OTP', () => {
    it('returns TooManyRequests error', async () => {
      canRequestNewOtpMock.mockResolvedValueOnce(false);

      const [error] = await initMagicCode('test@example.com');

      expect(error).toEqual(InitMagicCodeError.TooManyRequests);
    });
  });

  describe('when the user can request a new OTP', () => {
    it('expires all existing OTPs', async () => {
      canRequestNewOtpMock.mockResolvedValueOnce(true);

      await initMagicCode('test@example.com');

      expect(expireAllValidOtpsMock).toHaveBeenCalledWith('test@example.com');
    });

    it('creates a new OTP', async () => {
      canRequestNewOtpMock.mockResolvedValueOnce(true);
      await initMagicCode('test@example.com');

      expect(createOtpMock).toHaveBeenCalledWith({
        userId: userFixture.id,
        email: userFixture.email,
        codeHash: expect.any(String),
      });
    });

    it('creates proper code hash', async () => {
      canRequestNewOtpMock.mockResolvedValueOnce(true);
      await initMagicCode('test@example.com');

      const codeHash = createOtpMock.mock.calls[0][0].codeHash;

      expect(await argon2.verify(codeHash, code.toString())).toBe(true);
    });

    it('sends an email with the magic code', async () => {
      canRequestNewOtpMock.mockResolvedValueOnce(true);
      await initMagicCode('test@example.com');

      expect(sendEmailMagicCodeMock).toHaveBeenCalledWith({
        to: {
          email: userFixture.email,
        },
        code: code.toString(),
      });
    });
  });

  describe('verifyMagicCode', () => {
    it('returns Expired error if OTP is not found', async () => {
      getValidOtpMock.mockResolvedValueOnce(undefined);

      const [error] = await verifyMagicCode(otpFixture.id, otpFixture.email, '123456');

      expect(error).toEqual(VerifyMagicCodeError.Expired);
    });

    it('returns Expired error if email does not match', async () => {
      getValidOtpMock.mockResolvedValueOnce(otpFixture);

      const [error] = await verifyMagicCode(otpFixture.id, 'test@example.com', '123456');

      expect(error).toEqual(VerifyMagicCodeError.Expired);
    });

    it('returns Invalid error if code does not match', async () => {
      const code = '123456';
      const codeHash = await argon2.hash(code);

      getValidOtpMock.mockResolvedValueOnce({
        ...otpFixture,
        codeHash,
      });

      const [error] = await verifyMagicCode(otpFixture.id, otpFixture.email, '654321');

      expect(error).toEqual(VerifyMagicCodeError.Invalid);
    });

    it('returns otp if code matches', async () => {
      const code = '123456';
      const codeHash = await argon2.hash(code);

      getValidOtpMock.mockResolvedValueOnce({
        ...otpFixture,
        codeHash,
      });

      const [error, result] = await verifyMagicCode(
        otpFixture.id,
        otpFixture.email,
        code,
      );

      expect(error).toBeNull();
      expect(result).toEqual({
        otp: {
          ...otpFixture,
          codeHash,
        },
      });
    });
  });
});

describe('createSessionCookie', () => {
  it('creates a session cookie', async () => {
    const cookie = await createSessionCookie(userFixture.id);

    expect(cookie).toEqual('session=eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6WzExNiwxMDEsMTE1LDExNiw0NSwxMTYsMTExLDEwNywxMDEsMTEwXX0%3D.%2F3vkxbj7cWxDzrbM6IZt5QkflT2FjzAguou8P8fjDQg; Path=/; Expires=Mon, 15 Jun 2026 13:39:21 GMT; HttpOnly; SameSite=Lax');
  });
});
