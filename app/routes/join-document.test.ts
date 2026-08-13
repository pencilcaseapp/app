import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';
import { action } from './join-document';

const getDocumentMock = vi.fn();
const connectCollaboratorMock = vi.fn();
vi.mock('~/repos/document', async () => ({
  getDocument: (id: string) => getDocumentMock(id),
  connectCollaborator: (input: unknown) => connectCollaboratorMock(input),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function joinRequest() {
  return new Request(`http://localhost/doc/${documentFixture.id}/join`, {
    method: 'POST',
    body: new FormData(),
  });
}

function callAction(context: RouterContextProvider) {
  return action({
    request: joinRequest(),
    params: { id: documentFixture.id },
    context,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

test('connects a signed-in visitor to a shared document', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: true,
    userId: 'different-user-id',
  });

  await callAction(context);

  expect(connectCollaboratorMock).toHaveBeenCalledWith({
    documentId: documentFixture.id,
    userId: userFixture.id,
  });
});

test('does not connect the owner to their own document', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: true,
    userId: userFixture.id,
  });

  await callAction(context);

  expect(connectCollaboratorMock).not.toHaveBeenCalled();
});

test('does not connect when the document is not shared', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  getDocumentMock.mockResolvedValue({
    ...documentFixture,
    shared: false,
    userId: 'different-user-id',
  });

  await callAction(context);

  expect(connectCollaboratorMock).not.toHaveBeenCalled();
});

test('rejects an anonymous visitor', async () => {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, null);

  const thrown = await callAction(context).catch((error: unknown) => error);

  expect(thrown).toMatchObject({ init: { status: 401 } });
  expect(connectCollaboratorMock).not.toHaveBeenCalled();
});
