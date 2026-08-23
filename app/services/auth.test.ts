// @vitest-environment node

import { beforeEach, describe, it, expect, vi } from 'vitest';
import { createSessionCookie, getAuthSession, getSignInUrl, initMagicCode, InitMagicCodeError, onboardUser, verifyMagicCode, VerifyMagicCodeError } from './auth';
import { userFixture, userSessionFixture } from '~/test/fixtures/user';
import argon2 from 'argon2';
import { otpFixture } from '~/test/fixtures/otp';

const canRequestNewOtpMock = vi.fn();
const expireAllValidOtpsMock = vi.fn();
const createOtpMock = vi.fn();
const getValidOtpMock = vi.fn();
const markOtpAsUsedMock = vi.fn();
const expireOtpMock = vi.fn();
const recordFailedOtpAttemptMock = vi.fn();
vi.mock('~/repos/otp', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual as object,
    canRequestNewOtp: (...args: unknown[]) => canRequestNewOtpMock(...args),
    expireAllValidOtps: (...args: unknown[]) => expireAllValidOtpsMock(...args),
    createOtp: (...args: unknown[]) => createOtpMock(...args),
    getValidOtp: (...args: unknown[]) => getValidOtpMock(...args),
    markOtpAsUsed: (...args: unknown[]) => markOtpAsUsedMock(...args),
    expireOtp: (...args: unknown[]) => expireOtpMock(...args),
    recordFailedOtpAttempt: (...args: unknown[]) =>
      recordFailedOtpAttemptMock(...args),
  };
});

const getAndRefreshUserSessionMock = vi.fn();
const updateUserMock = vi.fn();
const getOrCreateUserByEmailMock = vi.fn(() => userFixture);
vi.mock('~/repos/user', () => ({
  getOrCreateUserByEmail: (...args: unknown[]) =>
    getOrCreateUserByEmailMock(...args as []),
  createUserSession: () => ({
    ...userSessionFixture,
    expiresAt: new Date('2026-06-15T13:39:21.509Z'),
  }),
  getAndRefreshUserSession: (...args: unknown[]) =>
    getAndRefreshUserSessionMock(...args),
  updateUser: (...args: unknown[]) => updateUserMock(...args),
}));

const sendEmailMagicCodeMock = vi.fn();
vi.mock('./email-templates', () => ({
  sendEmailMagicCode: (...args: unknown[]) => sendEmailMagicCodeMock(...args),
}));

const code = 123456;
const tokenBuffer = Buffer.from('test-token');
vi.mock('node:crypto', () => ({
  randomInt: vi.fn(() => code),
  randomBytes: vi.fn(() => tokenBuffer),
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => 'hashed-token'),
    })),
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const validSessionCookie
  = 'session=eyJ0b2tlbiI6InlwaW5LeFd3bkF1YWVFS1lrUnRRWVRGREtKSm5JdmU1a3I2NXZzUDU2LXcifQ%3D%3D.7FWkYgIL8Aj2ImIH%2F4VgSCgJf1XI4OWWzTi1GbutCBo; Path=/; HttpOnly; SameSite=Lax';

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
        email: 'test@example.com',
        canonicalEmail: 'test@example.com',
        codeHash: expect.any(String),
      });
    });

    it('does not create a user yet', async () => {
      canRequestNewOtpMock.mockResolvedValueOnce(true);
      await initMagicCode('test@example.com');

      expect(getOrCreateUserByEmailMock).not.toHaveBeenCalled();
    });

    it('normalizes the address it sends to', async () => {
      canRequestNewOtpMock.mockResolvedValueOnce(true);
      await initMagicCode('  John.Smith+promo@GMAIL.com ');

      expect(createOtpMock).toHaveBeenCalledWith({
        email: 'john.smith+promo@gmail.com',
        canonicalEmail: 'johnsmith@gmail.com',
        codeHash: expect.any(String),
      });
    });

    it('rate limits by the canonical mailbox', async () => {
      canRequestNewOtpMock.mockResolvedValueOnce(true);
      await initMagicCode('J.o.h.n.S.m.i.t.h+x@gmail.com');

      expect(canRequestNewOtpMock)
        .toHaveBeenCalledWith('johnsmith@gmail.com');
      expect(expireAllValidOtpsMock)
        .toHaveBeenCalledWith('johnsmith@gmail.com');
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
          email: 'test@example.com',
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
      recordFailedOtpAttemptMock.mockResolvedValueOnce({
        ...otpFixture,
        attempts: 1,
      });

      const [error] = await verifyMagicCode(otpFixture.id, otpFixture.email, '654321');

      expect(error).toEqual(VerifyMagicCodeError.Invalid);
      expect(recordFailedOtpAttemptMock).toHaveBeenCalledWith(otpFixture.id);
      expect(expireOtpMock).not.toHaveBeenCalled();
    });

    it('expires the otp after too many wrong codes', async () => {
      const code = '123456';
      const codeHash = await argon2.hash(code);

      getValidOtpMock.mockResolvedValueOnce({
        ...otpFixture,
        codeHash,
      });
      recordFailedOtpAttemptMock.mockResolvedValueOnce({
        ...otpFixture,
        attempts: 5,
      });

      const [error] = await verifyMagicCode(otpFixture.id, otpFixture.email, '654321');

      expect(error).toEqual(VerifyMagicCodeError.Expired);
      expect(expireOtpMock).toHaveBeenCalledWith(otpFixture.id);
    });

    it('does not count a matching code as an attempt', async () => {
      const code = '123456';
      const codeHash = await argon2.hash(code);

      getValidOtpMock.mockResolvedValueOnce({
        ...otpFixture,
        codeHash,
      });

      await verifyMagicCode(otpFixture.id, otpFixture.email, code);

      expect(recordFailedOtpAttemptMock).not.toHaveBeenCalled();
    });

    it('returns otp and user if code matches', async () => {
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
        user: userFixture,
      });
    });

    it('matches the email case-insensitively', async () => {
      const code = '123456';
      const codeHash = await argon2.hash(code);

      getValidOtpMock.mockResolvedValueOnce({
        ...otpFixture,
        codeHash,
      });

      const [error] = await verifyMagicCode(
        otpFixture.id,
        otpFixture.email.toUpperCase(),
        code,
      );

      expect(error).toBeNull();
    });

    it('creates the user with the normalized address', async () => {
      const code = '123456';
      const codeHash = await argon2.hash(code);

      getValidOtpMock.mockResolvedValueOnce({
        ...otpFixture,
        email: 'John@Example.com',
        codeHash,
      });

      await verifyMagicCode(otpFixture.id, 'John@Example.com', code);

      expect(getOrCreateUserByEmailMock)
        .toHaveBeenCalledWith('john@example.com');
    });
  });
});

describe('createSessionCookie', () => {
  it('creates a session cookie', async () => {
    const cookie = await createSessionCookie({
      request: new Request('http://localhost'),
      userId: userFixture.id,
    });

    expect(cookie).toEqual('session=eyJ0b2tlbiI6ImRHVnpkQzEwYjJ0bGJnIn0%3D.pE9RChiDigQ%2FRdGtdew12THRAUPdb198wbNhAe0l9fw; Path=/; Expires=Mon, 15 Jun 2026 13:39:21 GMT; HttpOnly; SameSite=Lax');
  });
});

describe('getAuthSession', () => {
  it('returns null if no session cookie is present', async () => {
    const request = new Request('http://localhost');
    const session = await getAuthSession(request);

    expect(session).toBeNull();
  });

  it('returns null if session is not found', async () => {
    getAndRefreshUserSessionMock.mockResolvedValueOnce(null);

    const request = new Request('http://localhost', {
      headers: {
        Cookie: validSessionCookie,
      },
    });

    const session = await getAuthSession(request);

    expect(session).toBeNull();
  });

  it('returns authenticated session and refreshed cookie when session is valid', async () => {
    const expiresAt = new Date('2026-06-15T13:39:21.509Z');
    getAndRefreshUserSessionMock.mockResolvedValueOnce({
      session: {
        ...userSessionFixture,
        expiresAt,
      },
      user: userFixture,
      isRefreshed: true,
    });

    const request = new Request('http://localhost', {
      headers: {
        Cookie: validSessionCookie,
      },
    });

    const session = await getAuthSession(request);

    expect(session).toEqual({
      user: userFixture,
      cookieHeader: 'session=eyJ0b2tlbiI6InlwaW5LeFd3bkF1YWVFS1lrUnRRWVRGREtKSm5JdmU1a3I2NXZzUDU2LXcifQ%3D%3D.7FWkYgIL8Aj2ImIH%2F4VgSCgJf1XI4OWWzTi1GbutCBo; Path=/; Expires=Mon, 15 Jun 2026 13:39:21 GMT; HttpOnly; SameSite=Lax',
    });
  });
});

describe('onboardUser', () => {
  it('updates the user with the provided name and newsletter preference', async () => {
    await onboardUser(userFixture.id, {
      name: 'John Doe',
      newsletter: true,
    });

    expect(updateUserMock).toHaveBeenCalledWith(userFixture.id, {
      name: 'John Doe',
      newsletter: true,
      onboarded: true,
    });
  });
});

describe('getSignInUrl', () => {
  it('sets default return url to startpage', async () => {
    const expectedReturnUrl = encodeURIComponent('/');

    expect(getSignInUrl()).toEqual(`/signin?returnUrl=${expectedReturnUrl}`);
  });

  it('discards external return urls', async () => {
    const expectedReturnUrl = encodeURIComponent('/');

    expect(getSignInUrl('https://example.com')).toEqual(`/signin?returnUrl=${expectedReturnUrl}`);
    expect(getSignInUrl('//example.com')).toEqual(`/signin?returnUrl=${expectedReturnUrl}`);
  });
});
