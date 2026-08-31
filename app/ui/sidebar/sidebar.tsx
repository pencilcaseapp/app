import { type FC, type PropsWithChildren } from 'react';
import { useMedia } from 'react-use';
import { SidebarPortal } from '../sidebar-portal/sidebar-portal';
import { Drawer } from '../drawer/drawer';
import { DrawerContent } from '../drawer/drawer-content';
import { useSidebarContext } from '../sidebar-context/use-sidebar-context';
import type { SidebarMenuItem, SidebarBaseProps } from './types';
import { SidebarMenu } from './sidebar-menu';

export type { SidebarMenuItem };

/**
 * `children` is the page the sidebar sits next to. On mobile it renders
 * inside the sidebar's `Drawer` root (not its popup), so a drawer opened
 * from anywhere in the page registers as a nested drawer and stacks on
 * the sidebar instead of just covering it.
 */
export type SidebarProps = SidebarBaseProps & PropsWithChildren & {
  /** Height the mobile drawer reserves for the `bottomArea` footer. */
  reservedFooterHeight?: number;
};

/**
 * The height of the sidebar's mobile drawer, shared with overlays that
 * stack a nested drawer on top of it so both line up.
 */
export const SIDEBAR_DRAWER_MAX_HEIGHT = 'calc(100dvh - 56px)';

export const Sidebar: FC<SidebarProps> = ({
  bottomArea,
  items,
  // The footer's rendered height: two navigation items
  // plus the gap and the footer's own top padding.
  reservedFooterHeight = 123,
  children,
}) => {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebarContext();
  const isMobile = useMedia('(max-width: 640px)', false);

  if (isMobile) {
    return (
      <Drawer open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DrawerContent
          isFullHeight
          maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}
          reservedFooterHeight={reservedFooterHeight}
          contentClassName="px-3 pb-6"
          footerArea={bottomArea && (
            <div className="flex flex-col gap-1.5">
              {bottomArea}
            </div>
          )}
        >
          <nav>
            <ul className="flex flex-col gap-2">
              {items.map(({ key, content }) => {
                return <li key={key}>{content}</li>;
              })}
            </ul>
          </nav>
        </DrawerContent>
        {children}
      </Drawer>
    );
  }

  return (
    <>
      <SidebarPortal
        tabletChildren={(
          <SidebarMenu
            initialState="close"
            bottomArea={bottomArea}
            items={items}
          />
        )}
        desktopChildren={(
          <SidebarMenu
            showSlimSidebar
            bottomArea={bottomArea}
            items={items}
          />
        )}
      />
      {children}
    </>
  );
};
