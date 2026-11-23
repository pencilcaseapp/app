import { describe, expect, test } from 'vitest';
import { readUserPrefs, storeUserPrefs } from './user-prefs-cookie';

function requestWith(cookie: string) {
  const request = new Request('http://localhost/');
  // happy-dom drops `cookie` when it is passed to the Request constructor.
  request.headers.set('cookie', cookie);

  return request;
}

describe('user prefs cookie', () => {
  test('reads the defaults without a cookie', async () => {
    expect(await readUserPrefs(new Request('http://localhost/')))
      .toEqual({ sidebarOpen: true, folder: 'all' });
  });

  test('reads the defaults from a cookie it cannot read', async () => {
    expect(await readUserPrefs(requestWith('user-prefs=bm9wZQ%3D%3D')))
      .toEqual({ sidebarOpen: true, folder: 'all' });
  });

  test('reads back what was stored', async () => {
    await storeUserPrefs({ sidebarOpen: false, folder: 'all' });
    expect(await readUserPrefs(requestWith(document.cookie)))
      .toEqual({ sidebarOpen: false, folder: 'all' });

    await storeUserPrefs({ sidebarOpen: true });
    expect(await readUserPrefs(requestWith(document.cookie)))
      .toEqual({ sidebarOpen: true, folder: 'all' });
  });

  test('keeps the other preferences when one changes', async () => {
    await storeUserPrefs({ sidebarOpen: false, folder: 'all' });
    await storeUserPrefs({ folder: 'shared' });

    expect(await readUserPrefs(requestWith(document.cookie)))
      .toEqual({ sidebarOpen: false, folder: 'shared' });
  });

  test('falls back to all documents for a folder it does not know', async () => {
    const cookie = Buffer.from(JSON.stringify({ folder: 'pinned' }))
      .toString('base64');

    expect(await readUserPrefs(requestWith(`user-prefs=${cookie}`)))
      .toEqual({ sidebarOpen: true, folder: 'all' });
  });
});
