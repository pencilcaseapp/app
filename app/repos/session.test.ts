import { describe, it, expect } from 'vitest';
import { createSession, getSessionByTokenHash } from './session';
import { createTestUser } from '~/test/data-factories/user';
import { createExpiredSession, createValidSession } from '~/test/data-factories/session';

describe('createSession', () => {
  it('creates a session', async () => {
    const userFixture = await createTestUser();
    const tokenHash = `hashed-code-${Date.now()}`;

    const session = await createSession({
      userId: userFixture.id,
      tokenHash,
      userAgent: 'test-agent',
    });

    expect(session).toStrictEqual({
      id: expect.any(String),
      userId: userFixture.id,
      tokenHash,
      userAgent: 'test-agent',
      createdAt: expect.any(Date),
      expiresAt: expect.any(Date),
    });
  });
});

describe('getSessionByTokenHash', () => {
  it('returns a session by token hash', async () => {
    const userFixture = await createTestUser();
    const sessionFixture = await createValidSession(userFixture.id);

    const session = await getSessionByTokenHash(sessionFixture.tokenHash);

    expect(session).toStrictEqual({
      id: sessionFixture.id,
      userId: userFixture.id,
      tokenHash: sessionFixture.tokenHash,
      userAgent: sessionFixture.userAgent,
      createdAt: sessionFixture.createdAt,
      expiresAt: sessionFixture.expiresAt,
    });
  });

  it('returns null if no session is found', async () => {
    const session = await getSessionByTokenHash('non-existent-token-hash');

    expect(session).toBeUndefined();
  });

  it('returns null if session is expired', async () => {
    const userFixture = await createTestUser();
    const sessionFixture = await createExpiredSession(userFixture.id);

    const session = await getSessionByTokenHash(sessionFixture.tokenHash);

    expect(session).toBeUndefined();
  });

  it('updates the session expiry if it is close to expiring', async () => {
    const userFixture = await createTestUser();
    const expiresAt = new Date(Date.now() + (29 * 24 * 60 * 60 * 1000));
    const sessionFixture = await createValidSession(userFixture.id, expiresAt);

    const session = await getSessionByTokenHash(sessionFixture.tokenHash);

    const expectedExpiry = Date.now() + (29 * 24 * 60 * 60 * 1000);

    expect(session?.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry);
  });
});
