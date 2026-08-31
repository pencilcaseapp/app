import { useEffect, useState } from 'react';
import {
  matchPath,
  Outlet,
  useLocation,
  useNavigate,
  type MiddlewareFunction,
} from 'react-router';
import { useMedia } from 'react-use';
import { SETTINGS_SIDE_NAVIGATION_QUERY } from '~/components/settings-dialog/settings-dialog';
import type {
  SettingsOutletContext,
  SettingsSection,
} from '~/components/settings-dialog/settings-dialog';
import { ResponsiveDialog } from '~/ui/responsive-dialog/responsive-dialog';
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
 * only keeps the responsive dialog open across the section routes; the
 * outlet renders the menu (index) or a section, each bringing its own
 * dialog content. The dialog mounts closed and opens a frame later so
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

  // Opened two frames after mounting: the popup then mounts after the
  // navigation's own render has painted, so its starting style gets a
  // painted frame and the enter animation plays. One frame (or a
  // timeout) still shares the navigation's busy frame and the drawer
  // snaps into place instead of sliding up.
  useEffect(() => {
    let secondFrame: number;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setOpen(true));
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  // The side navigation has no menu page; its index is the account
  // section.
  useEffect(() => {
    if (hasSideNavigation && section === null) {
      void navigate('account', { replace: true });
    }
  }, [hasSideNavigation, section, navigate]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          void navigate('..');
        }
      }}
    >
      <Outlet context={{ user } satisfies SettingsOutletContext} />
    </ResponsiveDialog>
  );
}
