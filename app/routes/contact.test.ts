// @vitest-environment node

import { beforeEach, expect, test, vi } from 'vitest';
import { sendContactMessage } from '~/services/contact';
import { action } from './contact';
import type { Route } from './+types/contact';

vi.mock('~/services/contact', () => ({
  sendContactMessage: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function callAction(fields: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  const request = new Request('http://localhost/contact', {
    method: 'POST',
    body: formData,
  });

  return action({
    request,
    url: new URL(request.url),
    pattern: '/contact',
    params: {},
  } as Route.ActionArgs);
}

test('mails the message and lets the website read the answer', async () => {
  const response = await callAction({
    email: ' sam@example.com ',
    message: ' Hello \n',
  });

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ sent: true });
  expect(response.headers.get('Access-Control-Allow-Origin'))
    .toBe('http://localhost:5173');
  expect(sendContactMessage).toHaveBeenCalledWith({
    email: 'sam@example.com',
    message: 'Hello',
  });
});

test.each([
  { email: 'sam', message: 'Hello' },
  { email: 'sam@example.com\nBcc: eve@example.com', message: 'Hello' },
  { email: 'sam@example.com', message: '   ' },
  { email: 'sam@example.com', message: 'a'.repeat(5001) },
])('refuses $email without sending it', async (fields) => {
  const response = await callAction(fields);

  expect(response.status).toBe(400);
  expect(response.headers.get('Access-Control-Allow-Origin'))
    .toBe('http://localhost:5173');
  expect(sendContactMessage).not.toHaveBeenCalled();
});
