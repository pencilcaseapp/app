import type { MiddlewareFunction } from 'react-router';
import { authMiddleware } from '~/middleware/auth';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

/*
 * The URL for the settings dialog over a document. The dialog itself is
 * rendered by the editor layout, which keeps it mounted so the open and
 * close animations play and, on mobile, nests it inside the sidebar
 * drawer so the two stack. This route contributes the address and the
 * sign-in redirect for deep links.
 */
export default function DocSettings() {
  return null;
}
