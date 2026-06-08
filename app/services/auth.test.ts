import { beforeEach, describe, it, expect, vi } from 'vitest';
import { initMagicCode, InitMagicCodeError } from './auth';
import { userFixture } from '~/test/fixtures/user';
import argon2 from 'argon2';

const canRequestNewOtpMock = vi.fn();
const expireAllValidOtpsMock = vi.fn();
const createOtpMock = vi.fn();
vi.mock('~/repos/otp', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual as object,
    canRequestNewOtp: (...args: unknown[]) => canRequestNewOtpMock(...args),
    expireAllValidOtps: (...args: unknown[]) => expireAllValidOtpsMock(...args),
    createOtp: (...args: unknown[]) => createOtpMock(...args),
  };
});

vi.mock('~/repos/user', () => ({
  getOrCreateUserByEmail: () => userFixture,
}));

const sendEmailMagicCodeMock = vi.fn();
vi.mock('./email-templates', () => ({
  sendEmailMagicCode: (...args: unknown[]) => sendEmailMagicCodeMock(...args),
}));

const code = 123456;
vi.mock('node:crypto', () => ({
  default: {
    randomInt: vi.fn(() => code),
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
});
