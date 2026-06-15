import { describe, it, expect } from 'vitest';
import { createSession } from './session';
import { createTestUser } from '~/test/data-factories/user';

describe('createSession', () => {
  it('creates a session', async () => {
    const userFixture = await createTestUser();

    const session = await createSession({
      userId: userFixture.id,
      tokenHash: 'hashed-code',
      userAgent: 'test-agent',
    });

    expect(session).toStrictEqual({
      id: expect.any(String),
      userId: userFixture.id,
      tokenHash: 'hashed-code',
      userAgent: 'test-agent',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      expiresAt: expect.any(Date),
    });
  });
});
