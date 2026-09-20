// @vitest-environment node

import argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emailChangeRequestFixture } from '~/test/fixtures/email-change-request';
import { userFixture } from '~/test/fixtures/user';
import {
  initEmailChange,
  InitEmailChangeError,
  verifyEmailChange,
  VerifyEmailChangeError,
} from './email-change';

const canRequestEmailChangeMock = vi.fn();
const createEmailChangeRequestMock = vi.fn();
const expireAllValidEmailChangeRequestsMock = vi.fn();
const expireEmailChangeRequestMock = vi.fn();
const getValidEmailChangeRequestMock = vi.fn();
const markEmailChangeRequestAsUsedMock = vi.fn();
const recordFailedEmailChangeRequestAttemptMock = vi.fn();
vi.mock('~/repos/email-change-request', () => ({
  canRequestEmailChange: (...args: unknown[]) =>
    canRequestEmailChangeMock(...args),
  createEmailChangeRequest: (...args: unknown[]) =>
    createEmailChangeRequestMock(...args),
  expireAllValidEmailChangeRequests: (...args: unknown[]) =>
    expireAllValidEmailChangeRequestsMock(...args),
  expireEmailChangeRequest: (...args: unknown[]) =>
    expireEmailChangeRequestMock(...args),
  getValidEmailChangeRequest: (...args: unknown[]) =>
    getValidEmailChangeRequestMock(...args),
  markEmailChangeRequestAsUsed: (...args: unknown[]) =>
    markEmailChangeRequestAsUsedMock(...args),
  recordFailedEmailChangeRequestAttempt: (...args: unknown[]) =>
    recordFailedEmailChangeRequestAttemptMock(...args),
}));

const getUserByEmailMock = vi.fn();
const updateUserMock = vi.fn();
vi.mock('~/repos/user', () => ({
  getUserByEmail: (...args: unknown[]) => getUserByEmailMock(...args),
  updateUser: (...args: unknown[]) => updateUserMock(...args),
}));

const sendEmailChangeCodeMock = vi.fn();
vi.mock('./email-templates', () => ({
  sendEmailChangeCode: (...args: unknown[]) => sendEmailChangeCodeMock(...args),
}));

const syncCreemCustomerEmailMock = vi.fn();
vi.mock('./subscription', () => ({
  syncCreemCustomerEmail:
    (...args: unknown[]) => syncCreemCustomerEmailMock(...args),
}));

const code = 123456;
vi.mock('node:crypto', () => ({
  randomInt: vi.fn(() => code),
}));

const user = { ...userFixture, email: 'old@example.com' };

beforeEach(() => {
  vi.clearAllMocks();
  canRequestEmailChangeMock.mockResolvedValue(true);
  getUserByEmailMock.mockResolvedValue(undefined);
  createEmailChangeRequestMock.mockResolvedValue(emailChangeRequestFixture);
});

describe('initEmailChange', () => {
  it('refuses the address the account already has', async () => {
    const [error] = await initEmailChange(user, ' Old@Example.com ');

    expect(error).toBe(InitEmailChangeError.SameEmail);
    expect(createEmailChangeRequestMock).not.toHaveBeenCalled();
  });

  it('refuses an address another account has', async () => {
    getUserByEmailMock.mockResolvedValueOnce({ ...userFixture, id: 'other' });

    const [error] = await initEmailChange(user, 'new@example.com');

    expect(error).toBe(InitEmailChangeError.EmailTaken);
    expect(getUserByEmailMock).toHaveBeenCalledWith('new@example.com');
    expect(createEmailChangeRequestMock).not.toHaveBeenCalled();
  });

  it('rate limits by the user and the canonical mailbox', async () => {
    canRequestEmailChangeMock.mockResolvedValueOnce(false);

    const [error] = await initEmailChange(user, 'J.o.h.n+x@gmail.com');

    expect(error).toBe(InitEmailChangeError.TooManyRequests);
    expect(canRequestEmailChangeMock)
      .toHaveBeenCalledWith(user.id, 'john@gmail.com');
    expect(createEmailChangeRequestMock).not.toHaveBeenCalled();
    expect(sendEmailChangeCodeMock).not.toHaveBeenCalled();
  });

  it('expires the pending requests of the user first', async () => {
    await initEmailChange(user, 'new@example.com');

    expect(expireAllValidEmailChangeRequestsMock)
      .toHaveBeenCalledWith(user.id);
  });

  it('creates the request with a hash of the code', async () => {
    const [error, result] = await initEmailChange(user, ' New@Example.com ');

    expect(error).toBeNull();
    expect(result?.request).toBe(emailChangeRequestFixture);
    expect(createEmailChangeRequestMock).toHaveBeenCalledWith({
      userId: user.id,
      email: 'new@example.com',
      canonicalEmail: 'new@example.com',
      codeHash: expect.any(String),
    });

    const { codeHash } = createEmailChangeRequestMock.mock.calls[0][0];
    expect(await argon2.verify(codeHash, code.toString())).toBe(true);
  });

  it('sends the code to the new address', async () => {
    await initEmailChange(user, 'new@example.com');

    expect(sendEmailChangeCodeMock).toHaveBeenCalledWith({
      to: { email: 'new@example.com' },
      code: code.toString(),
      requestId: emailChangeRequestFixture.id,
      userId: user.id,
    });
  });

  it('does not touch the user yet', async () => {
    await initEmailChange(user, 'new@example.com');

    expect(updateUserMock).not.toHaveBeenCalled();
  });
});

describe('verifyEmailChange', () => {
  const request = {
    ...emailChangeRequestFixture,
    userId: user.id,
    email: 'new@example.com',
  };

  beforeEach(async () => {
    request.codeHash = await argon2.hash(code.toString());
    getValidEmailChangeRequestMock.mockResolvedValue(request);
    updateUserMock.mockImplementation(
      (id: string, input: { email: string }) => ({ ...user, ...input }),
    );
  });

  it('reports a missing request as expired', async () => {
    getValidEmailChangeRequestMock.mockResolvedValueOnce(undefined);

    const [error] = await verifyEmailChange(user, request.id, '123456');

    expect(error).toBe(VerifyEmailChangeError.Expired);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('refuses the request of another user', async () => {
    getValidEmailChangeRequestMock
      .mockResolvedValueOnce({ ...request, userId: 'someone-else' });

    const [error] = await verifyEmailChange(user, request.id, '123456');

    expect(error).toBe(VerifyEmailChangeError.Expired);
    expect(recordFailedEmailChangeRequestAttemptMock).not.toHaveBeenCalled();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('records a wrong code as a failed attempt', async () => {
    recordFailedEmailChangeRequestAttemptMock
      .mockResolvedValueOnce({ ...request, attempts: 1 });

    const [error] = await verifyEmailChange(user, request.id, '000000');

    expect(error).toBe(VerifyEmailChangeError.Invalid);
    expect(recordFailedEmailChangeRequestAttemptMock)
      .toHaveBeenCalledWith(request.id);
    expect(expireEmailChangeRequestMock).not.toHaveBeenCalled();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('expires the request on the fifth wrong code', async () => {
    recordFailedEmailChangeRequestAttemptMock
      .mockResolvedValueOnce({ ...request, attempts: 5 });

    const [error] = await verifyEmailChange(user, request.id, '000000');

    expect(error).toBe(VerifyEmailChangeError.Expired);
    expect(expireEmailChangeRequestMock).toHaveBeenCalledWith(request.id);
  });

  it('spends the request and refuses an address taken meanwhile',
    async () => {
      getUserByEmailMock
        .mockResolvedValueOnce({ ...userFixture, id: 'other' });

      const [error] = await verifyEmailChange(user, request.id, '123456');

      expect(error).toBe(VerifyEmailChangeError.EmailTaken);
      expect(markEmailChangeRequestAsUsedMock)
        .toHaveBeenCalledWith(request.id);
      expect(updateUserMock).not.toHaveBeenCalled();
    });

  it('moves the user to the new address once the code is right',
    async () => {
      const [error, result]
        = await verifyEmailChange(user, request.id, '123456');

      expect(error).toBeNull();
      expect(result?.user.email).toBe('new@example.com');
      expect(markEmailChangeRequestAsUsedMock)
        .toHaveBeenCalledWith(request.id);
      expect(updateUserMock)
        .toHaveBeenCalledWith(user.id, { email: 'new@example.com' });
    });

  it('hands the new address to Creem', async () => {
    await verifyEmailChange(user, request.id, '123456');

    expect(syncCreemCustomerEmailMock)
      .toHaveBeenCalledWith({ ...user, email: 'new@example.com' });
  });

  it('leaves Creem alone when the code is wrong', async () => {
    recordFailedEmailChangeRequestAttemptMock
      .mockResolvedValueOnce({ ...request, attempts: 1 });

    await verifyEmailChange(user, request.id, '000000');

    expect(syncCreemCustomerEmailMock).not.toHaveBeenCalled();
  });
});
