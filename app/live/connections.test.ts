// @vitest-environment node

import type { Hocuspocus } from '@hocuspocus/server';
import type { RedisInstance } from '@hocuspocus/extension-redis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveCloseReason } from '~/constants/live';
import {
  closeDocumentConnections,
  registerLiveServer,
  registerRevocationChannel,
  updateDocumentAccess,
  type ResolveLiveAccess,
} from './connections';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';

const otherUserId = 'e6d9c8f1-0000-4000-8000-000000000000';
const revocationChannel = 'pencil-case:live:revoke-access';

function connection(userId?: string, readOnly = false) {
  return {
    context: {
      userId,
      viewer: userId ? { id: userId, email: `${userId}@example.com` } : undefined,
    },
    readOnly,
    close: vi.fn(),
    sendStateless: vi.fn(),
  };
}

const resolveAccess = vi.fn<ResolveLiveAccess>();

function registerDocument(
  connections: ReturnType<typeof connection>[],
  documentId = documentFixture.id,
) {
  registerLiveServer({
    documents: new Map([[documentId, {
      connections: new Map(
        connections.map(item => [item, { clients: new Set() }]),
      ),
    }]]),
  } as unknown as Hocuspocus, resolveAccess);
}

/** Resolves the access of a viewer to what the given map says, or none. */
function resolveAccessTo(access: Record<string, boolean>) {
  resolveAccess.mockImplementation(async (_documentId, viewer) => {
    const key = viewer?.id ?? 'guest';
    return key in access ? { readOnly: access[key] } : undefined;
  });
}

function accessMessage(readOnly: boolean) {
  return JSON.stringify({ type: 'access', readOnly });
}

/**
 * The publisher lives on `globalThis`, so it outlives the module registry and
 * has to be cleared between the tests that register one and the ones that do
 * not.
 */
function redisStub() {
  let listener: ((channel: string, message: string) => void) | undefined;

  const stub = {
    publish: vi.fn(),
    subscribe: vi.fn(),
    on: vi.fn((_event: string, handler: typeof listener) => {
      listener = handler;
    }),
    receive: (channel: string, message: string) => listener?.(channel, message),
  };

  return stub;
}

function registerChannel() {
  const publisher = redisStub();
  const subscriber = redisStub();

  registerRevocationChannel(
    publisher as unknown as RedisInstance,
    subscriber as unknown as RedisInstance,
  );

  return { publisher, subscriber };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete (globalThis as { liveRevocationPublisher?: unknown })
    .liveRevocationPublisher;
});

describe('closeDocumentConnections', () => {
  it('closes every connection of the document', () => {
    const owner = connection(userFixture.id);
    const collaborator = connection(otherUserId);
    registerDocument([owner, collaborator]);

    closeDocumentConnections({ documentId: documentFixture.id });

    expect(owner.close).toHaveBeenCalledWith({
      code: 4403,
      reason: LiveCloseReason.AccessRevoked,
    });
    expect(collaborator.close).toHaveBeenCalledTimes(1);
  });

  it('keeps the given user connected', () => {
    const owner = connection(userFixture.id);
    const collaborator = connection(otherUserId);
    const visitor = connection();
    registerDocument([owner, collaborator, visitor]);

    closeDocumentConnections({
      documentId: documentFixture.id,
      keepUserId: userFixture.id,
    });

    expect(owner.close).not.toHaveBeenCalled();
    expect(collaborator.close).toHaveBeenCalledTimes(1);
    expect(visitor.close).toHaveBeenCalledTimes(1);
  });

  it('closes only the connections of the given user', () => {
    const owner = connection(userFixture.id);
    const collaborator = connection(otherUserId);
    const visitor = connection();
    registerDocument([owner, collaborator, visitor]);

    closeDocumentConnections({
      documentId: documentFixture.id,
      userId: otherUserId,
    });

    expect(owner.close).not.toHaveBeenCalled();
    expect(collaborator.close).toHaveBeenCalledTimes(1);
    expect(visitor.close).not.toHaveBeenCalled();
  });

  it('leaves the connections of other documents alone', () => {
    const collaborator = connection(otherUserId);
    registerDocument([collaborator], 'a5a1b3c7-0000-4000-8000-000000000000');

    closeDocumentConnections({ documentId: documentFixture.id });

    expect(collaborator.close).not.toHaveBeenCalled();
  });
});

describe('updateDocumentAccess', () => {
  it('switches a connection whose access changed, in place', async () => {
    const collaborator = connection(otherUserId, false);
    registerDocument([collaborator]);
    resolveAccessTo({ [otherUserId]: true });

    await updateDocumentAccess({
      documentId: documentFixture.id,
      userId: otherUserId,
    });

    expect(resolveAccess).toHaveBeenCalledWith(
      documentFixture.id,
      collaborator.context.viewer,
    );
    expect(collaborator.readOnly).toBe(true);
    expect(collaborator.sendStateless)
      .toHaveBeenCalledWith(accessMessage(true));
    expect(collaborator.close).not.toHaveBeenCalled();
  });

  it('leaves a connection alone that already has its access', async () => {
    const collaborator = connection(otherUserId, true);
    registerDocument([collaborator]);
    resolveAccessTo({ [otherUserId]: true });

    await updateDocumentAccess({
      documentId: documentFixture.id,
      userId: otherUserId,
    });

    expect(collaborator.sendStateless).not.toHaveBeenCalled();
    expect(collaborator.close).not.toHaveBeenCalled();
  });

  it('closes a connection whose access is gone', async () => {
    const collaborator = connection(otherUserId);
    registerDocument([collaborator]);
    resolveAccessTo({});

    await updateDocumentAccess({
      documentId: documentFixture.id,
      userId: otherUserId,
    });

    expect(collaborator.close).toHaveBeenCalledWith({
      code: 4403,
      reason: LiveCloseReason.AccessRevoked,
    });
    expect(collaborator.sendStateless).not.toHaveBeenCalled();
  });

  it('updates everybody but the given user, each to their own access', async () => {
    const owner = connection(userFixture.id);
    const collaborator = connection(otherUserId, false);
    const visitor = connection(undefined, false);
    registerDocument([owner, collaborator, visitor]);
    resolveAccessTo({ [otherUserId]: false, guest: true });

    await updateDocumentAccess({
      documentId: documentFixture.id,
      keepUserId: userFixture.id,
    });

    expect(resolveAccess).not.toHaveBeenCalledWith(
      documentFixture.id,
      owner.context.viewer,
    );
    expect(resolveAccess).toHaveBeenCalledWith(documentFixture.id, undefined);
    expect(owner.sendStateless).not.toHaveBeenCalled();
    expect(collaborator.sendStateless).not.toHaveBeenCalled();
    expect(visitor.readOnly).toBe(true);
    expect(visitor.sendStateless).toHaveBeenCalledWith(accessMessage(true));
  });

  it('updates only the connections of the given user', async () => {
    const collaborator = connection(otherUserId, true);
    const visitor = connection(undefined, true);
    registerDocument([collaborator, visitor]);
    resolveAccessTo({ [otherUserId]: false, guest: false });

    await updateDocumentAccess({
      documentId: documentFixture.id,
      userId: otherUserId,
    });

    expect(collaborator.sendStateless)
      .toHaveBeenCalledWith(accessMessage(false));
    expect(visitor.sendStateless).not.toHaveBeenCalled();
    expect(visitor.readOnly).toBe(true);
  });
});

describe('registerRevocationChannel', () => {
  it('publishes the revocation to the other instances', () => {
    const { publisher } = registerChannel();
    registerDocument([connection(userFixture.id)]);

    closeDocumentConnections({
      documentId: documentFixture.id,
      keepUserId: userFixture.id,
    });

    expect(publisher.publish).toHaveBeenCalledWith(
      revocationChannel,
      JSON.stringify({
        type: 'close',
        documentId: documentFixture.id,
        keepUserId: userFixture.id,
      }),
    );
  });

  it('publishes an access change to the other instances', async () => {
    const { publisher } = registerChannel();
    registerDocument([]);

    await updateDocumentAccess({
      documentId: documentFixture.id,
      userId: otherUserId,
    });

    expect(publisher.publish).toHaveBeenCalledWith(
      revocationChannel,
      JSON.stringify({
        type: 'access',
        documentId: documentFixture.id,
        userId: otherUserId,
      }),
    );
  });

  it('switches the connections an access change from another instance names', async () => {
    const { subscriber } = registerChannel();
    const collaborator = connection(otherUserId, false);
    registerDocument([collaborator]);
    resolveAccessTo({ [otherUserId]: true });

    subscriber.receive(revocationChannel, JSON.stringify({
      type: 'access',
      documentId: documentFixture.id,
      userId: otherUserId,
    }));
    await vi.waitFor(() => {
      expect(collaborator.sendStateless).toHaveBeenCalledWith(
        accessMessage(true),
      );
    });

    expect(collaborator.readOnly).toBe(true);
    expect(collaborator.close).not.toHaveBeenCalled();
  });

  it('closes on a revocation without a type, from an older instance', () => {
    const { subscriber } = registerChannel();
    const collaborator = connection(otherUserId);
    registerDocument([collaborator]);

    subscriber.receive(revocationChannel, JSON.stringify({
      documentId: documentFixture.id,
    }));

    expect(collaborator.close).toHaveBeenCalledTimes(1);
  });

  it('closes the connections a revocation from another instance names', () => {
    const { subscriber } = registerChannel();
    const owner = connection(userFixture.id);
    const collaborator = connection(otherUserId);
    registerDocument([owner, collaborator]);

    subscriber.receive(revocationChannel, JSON.stringify({
      documentId: documentFixture.id,
      keepUserId: userFixture.id,
    }));

    expect(owner.close).not.toHaveBeenCalled();
    expect(collaborator.close).toHaveBeenCalledWith({
      code: 4403,
      reason: LiveCloseReason.AccessRevoked,
    });
  });

  it('ignores messages published on another channel', () => {
    const { subscriber } = registerChannel();
    const collaborator = connection(otherUserId);
    registerDocument([collaborator]);

    subscriber.receive('pencil-case:live:something-else', JSON.stringify({
      documentId: documentFixture.id,
    }));

    expect(collaborator.close).not.toHaveBeenCalled();
  });
});
