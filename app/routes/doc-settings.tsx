import { href, redirect, type MiddlewareFunction } from 'react-router';
import { isSettingsSection } from '~/components/settings-dialog/settings-dialog';
import { authMiddleware } from '~/middleware/auth';
import type { Route } from './+types/doc-settings';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export function loader({ params }: Route.LoaderArgs) {
  if (params.section && !isSettingsSection(params.section)) {
    return redirect(
      href('/doc/:id/settings/:section?', { id: params.id }),
    );
  }
}

/*
 * The URLs for the settings dialog over a document — the menu at
 * `settings` and each section at `settings/:section`. The dialog itself
 * is rendered by the editor layout, which keeps it mounted so the open
 * and close animations play and, on mobile, nests it inside the sidebar
 * drawer so the two stack. This route contributes the addresses and the
 * sign-in redirect for deep links.
 */
export default function DocSettings() {
  return null;
}
