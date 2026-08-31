// @vitest-environment node

import { href, RouterContextProvider } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import { loader } from './signout';
import type { Route } from './+types/signout';

const signOutMock = vi.fn(() => 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
vi.mock('~/services/auth', () => ({
  signOut: (...args: unknown[]) => signOutMock(...args as []),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function callLoader(request: Request) {
  return loader({
    request,
    url: new URL(request.url),
    pattern: '/signout',
    params: {},
    context: new RouterContextProvider(),
  } as Route.LoaderArgs);
}

test('signs the user out and redirects to the startpage', async () => {
  const request = new Request('http://localhost/signout');

  const response = await callLoader(request);

  expect(signOutMock).toHaveBeenCalledWith(request);
  expect(response.status).toBe(302);
  expect(response.headers.get('Location')).toBe(href('/'));
  expect(response.headers.get('Set-Cookie'))
    .toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
});
