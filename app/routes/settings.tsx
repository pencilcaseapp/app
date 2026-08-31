import { useEffect, useState } from 'react';
import {
  matchPath,
  Outlet,
  useLocation,
  useNavigate,
  type MiddlewareFunction,
} from 'react-router';
import { useMedia } from 'react-use';
import {
  SETTINGS_SIDE_NAVIGATION_QUERY,
  SettingsDialog,
} from '~/components/settings-dialog/settings-dialog';
import type {
  SettingsOutletContext,
  SettingsSection,
} from '~/components/settings-dialog/settings-dialog';
import { userSessionContext } from '~/contexts/user-session';
import { authMiddleware } from '~/middleware/auth';
import type { Route } from './+types/settings';

export const middleware: MiddlewareFunction[] = [
  authMiddleware,
];

export function loader({ context }: Route.LoaderArgs) {
  return {
    user: context.get(userSessionContext),
  };
}

/*
 * The settings dialog over the document it was opened from: this route
 * renders the shell, the outlet renders the menu (index) or the section
 * routes below it. The dialog mounts closed and opens a frame later so
 * the enter animation plays, and closing waits for the exit animation
 * before navigating back up to the document.
 */
export default function Settings({
  loaderData: { user },
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasSideNavigation = useMedia(SETTINGS_SIDE_NAVIGATION_QUERY, false);

  // The child routes are the only ways this component renders, so the
  // last segment is always a section id or `settings` itself.
  const section = (matchPath(
    '/doc/:id/settings/:section',
    location.pathname,
  )?.params.section ?? null) as SettingsSection | null;

  const [open, setOpen] = useState(false);

  // Opened a tick after mounting so Base UI treats it as an open
  // transition and plays the enter animation.
  useEffect(() => {
    const timeout = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  // The side navigation has no menu page; its index is the account
  // section.
  useEffect(() => {
    if (hasSideNavigation && section === null) {
      void navigate('account', { replace: true });
    }
  }, [hasSideNavigation, section, navigate]);

  return (
    <SettingsDialog
      section={section}
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          void navigate('..');
        }
      }}
    >
      <Outlet context={{ user } satisfies SettingsOutletContext} />
    </SettingsDialog>
  );
}
