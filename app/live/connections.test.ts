// @vitest-environment node

import type { Hocuspocus } from '@hocuspocus/server';
import type { RedisInstance } from '@hocuspocus/extension-redis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveCloseReason } from '~/constants/live';
import {
  closeDocumentConnections,
  registerLiveServer,
  registerRevocationChannel,
} from './connections';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';

const otherUserId = 'e6d9c8f1-0000-4000-8000-000000000000';
const revocationChannel = 'pencil-case:live:revoke-access';

function connection(userId?: string) {
  return { context: { userId }, close: vi.fn() };
}

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
  } as unknown as Hocuspocus);
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

  it('leaves the connections of other documents alone', () => {
    const collaborator = connection(otherUserId);
    registerDocument([collaborator], 'a5a1b3c7-0000-4000-8000-000000000000');

    closeDocumentConnections({ documentId: documentFixture.id });

    expect(collaborator.close).not.toHaveBeenCalled();
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
        documentId: documentFixture.id,
        keepUserId: userFixture.id,
      }),
    );
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
