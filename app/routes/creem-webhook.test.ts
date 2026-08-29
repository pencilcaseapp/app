// @vitest-environment node

import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { HandleCreemWebhookError } from '~/services/subscription';
import { action } from './creem-webhook';
import type { Route } from './+types/creem-webhook';

const handleCreemWebhookMock = vi.fn();
vi.mock('~/services/subscription', async (importOriginal) => {
  const actual
    = await importOriginal<typeof import('~/services/subscription')>();
  return {
    ...actual,
    handleCreemWebhook:
      (...args: unknown[]) => handleCreemWebhookMock(...args),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction(init?: { method?: string; signature?: string }) {
  const request = new Request('http://localhost/webhooks/creem', {
    method: init?.method ?? 'POST',
    headers: init?.signature ? { 'creem-signature': init.signature } : {},
    body: init?.method === 'GET' ? undefined : '{"id":"evt_1"}',
  });

  return action({
    request,
    url: new URL(request.url),
    pattern: '/webhooks/creem',
    params: {},
    context: new RouterContextProvider(),
  } as Route.ActionArgs);
}

async function getThrownStatus(promise: Promise<unknown>) {
  try {
    await promise;
  }
  catch (error) {
    return (error as { init?: { status?: number } }).init?.status;
  }

  throw new Error('expected the action to throw');
}

test('acknowledges a handled event', async () => {
  handleCreemWebhookMock.mockResolvedValue([null]);

  const result = await callAction({ signature: 'sig' });

  expect(result.data).toStrictEqual({ received: true });
  expect(handleCreemWebhookMock)
    .toHaveBeenCalledWith('{"id":"evt_1"}', 'sig');
});

test('passes a missing signature header on as null', async () => {
  handleCreemWebhookMock.mockResolvedValue([null]);

  await callAction();

  expect(handleCreemWebhookMock)
    .toHaveBeenCalledWith('{"id":"evt_1"}', null);
});

test('responds 401 for an invalid signature', async () => {
  handleCreemWebhookMock
    .mockResolvedValue([HandleCreemWebhookError.InvalidSignature]);

  expect(await getThrownStatus(callAction({ signature: 'bad' }))).toBe(401);
});

test('responds 400 for a malformed payload', async () => {
  handleCreemWebhookMock
    .mockResolvedValue([HandleCreemWebhookError.MalformedPayload]);

  expect(await getThrownStatus(callAction({ signature: 'sig' }))).toBe(400);
});

test('responds 405 for anything but POST', async () => {
  expect(await getThrownStatus(callAction({ method: 'DELETE' }))).toBe(405);
  expect(handleCreemWebhookMock).not.toHaveBeenCalled();
});
