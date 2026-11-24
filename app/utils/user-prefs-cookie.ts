import { createCookie } from 'react-router';
import type { DocumentFolder } from '~/constants/document';
import { isDocumentFolder } from '~/utils/document-folder';

export interface UserPrefs {
  sidebarOpen: boolean;
  /** The folder the navigation lists. */
  folder: DocumentFolder;
}

const DEFAULT_USER_PREFS: UserPrefs = {
  sidebarOpen: true,
  folder: 'all',
};

/**
 * The reader's preferences, kept in one cookie rather than local storage so
 * the server can render the page with them, and in one cookie rather than
 * one per preference so a new one does not add a cookie.
 */
const userPrefsCookie = createCookie('user-prefs', {
  path: '/',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365,
});

async function parseUserPrefs(cookie: string | null): Promise<UserPrefs> {
  const value: unknown = await userPrefsCookie.parse(cookie);
  const stored = typeof value === 'object' && value !== null
    ? value as Partial<Record<keyof UserPrefs, unknown>>
    : {};

  return {
    sidebarOpen: typeof stored.sidebarOpen === 'boolean'
      ? stored.sidebarOpen
      : DEFAULT_USER_PREFS.sidebarOpen,
    folder: isDocumentFolder(stored.folder)
      ? stored.folder
      : DEFAULT_USER_PREFS.folder,
  };
}

export async function readUserPrefs(request: Request): Promise<UserPrefs> {
  return await parseUserPrefs(request.headers.get('cookie'));
}

export async function storeUserPrefs(prefs: Partial<UserPrefs>) {
  const current = await parseUserPrefs(document.cookie);
  document.cookie = await userPrefsCookie.serialize({ ...current, ...prefs });
}
