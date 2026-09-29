import { createCookie } from 'react-router';

/**
 * Whether the desktop sidebar is open, kept in a cookie rather than local
 * storage so the server can render the page with it.
 */
const sidebarCookie = createCookie('sidebar-open', {
  path: '/',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365,
});

/** Open unless the reader closed it. */
export async function readSidebarOpen(request: Request): Promise<boolean> {
  return await sidebarCookie.parse(request.headers.get('cookie')) !== false;
}

export async function storeSidebarOpen(isOpen: boolean) {
  document.cookie = await sidebarCookie.serialize(isOpen);
}
