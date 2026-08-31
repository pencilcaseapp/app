import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { ResponsiveDialog } from '~/ui/responsive-dialog/responsive-dialog';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';

/*
 * The settings dialog over the document it was opened from: this route
 * only keeps the responsive dialog open across the section routes; the
 * outlet renders the menu (index) or a section, each bringing its own
 * authentication, data and dialog content, so nothing is handed down
 * from here. The dialog mounts closed and opens a frame later so the
 * enter animation plays, and closing waits for the exit animation
 * before navigating back up to the document.
 */
export default function Settings() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setIsSidebarOpen } = useSidebarContext();

  const [open, setOpen] = useState(false);

  // On mobile the settings drawer stacks on the open sidebar, but a
  // direct load starts with the sidebar closed and the drawer would sit
  // over the bare document. Opening it restores the stack, so closing
  // settings reveals the sidebar it is normally opened from.
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(true);
    }
  }, [isMobile, setIsSidebarOpen]);

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
      <Outlet />
    </ResponsiveDialog>
  );
}
