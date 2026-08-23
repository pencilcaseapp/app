import { faker } from '@faker-js/faker';
import { RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { getAuthUserByCookie } from '~/services/auth';
import { action } from './e2e-auth';
import type { Route } from './+types/e2e-auth';
import type { Config } from '~/config';

const configOverride = vi.hoisted(
  () => ({ current: null as Partial<Config> | null }),
);

vi.mock('~/config', async () => {
  const actual = await vi.importActual<typeof import('~/config')>('~/config');
  return {
    ...actual,
    getConfig: () => ({ ...actual.getConfig(), ...configOverride.current }),
  };
});

beforeEach(() => {
  configOverride.current = null;
});

function callAction(init?: { token?: string; body?: unknown }) {
  const request = new Request('http://localhost/e2e/auth', {
    method: 'POST',
    headers: init?.token ? { Authorization: `Bearer ${init.token}` } : {},
    body: JSON.stringify(init?.body ?? {}),
  });

  return action({
    request,
    url: new URL(request.url),
    pattern: '/e2e/auth',
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

test('responds 404 when e2e auth is not configured', async () => {
  configOverride.current = { e2e: undefined };

  expect(await getThrownStatus(callAction({
    token: 'e2e-t0k3n',
    body: { email: faker.internet.email() },
  }))).toBe(404);
});

test('responds 401 without the api token', async () => {
  expect(await getThrownStatus(callAction({
    body: { email: faker.internet.email() },
  }))).toBe(401);
});

test('responds 401 with a wrong api token', async () => {
  expect(await getThrownStatus(callAction({
    token: 'wrong',
    body: { email: faker.internet.email() },
  }))).toBe(401);
});

test('responds 400 without a valid email', async () => {
  expect(await getThrownStatus(callAction({
    token: 'e2e-t0k3n',
    body: { email: 'not-an-email' },
  }))).toBe(400);
});

test('signs in an onboarded user with a session cookie', async () => {
  const email = faker.internet.email().toLowerCase();

  const result = await callAction({
    token: 'e2e-t0k3n',
    body: { email },
  });

  const headers = result.init?.headers as Record<string, string>;
  const setCookie = headers['Set-Cookie'];
  expect(setCookie).toContain('session=');

  const user = await getAuthUserByCookie(setCookie.split(';')[0]);
  expect(user?.email).toBe(email);
  expect(user?.onboarded).toBe(true);
});
