// @vitest-environment node

import type { Hocuspocus } from '@hocuspocus/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveCloseReason } from '~/constants/live';
import { closeDocumentConnections, registerLiveServer } from './connections';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';

const otherUserId = 'e6d9c8f1-0000-4000-8000-000000000000';

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

beforeEach(() => {
  vi.clearAllMocks();
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
