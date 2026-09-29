import { describe, expect, test } from 'vitest';
import { readSidebarOpen, storeSidebarOpen } from './sidebar-cookie';

function requestWith(cookie: string) {
  const request = new Request('http://localhost/');
  // happy-dom drops `cookie` when it is passed to the Request constructor.
  request.headers.set('cookie', cookie);

  return request;
}

describe('sidebar cookie', () => {
  test('reads as open without a cookie', async () => {
    expect(await readSidebarOpen(new Request('http://localhost/')))
      .toBe(true);
  });

  test('reads back what was stored', async () => {
    await storeSidebarOpen(false);
    expect(await readSidebarOpen(requestWith(document.cookie))).toBe(false);

    await storeSidebarOpen(true);
    expect(await readSidebarOpen(requestWith(document.cookie))).toBe(true);
  });
});
