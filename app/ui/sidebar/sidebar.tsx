import { type FC } from 'react';
import { useMedia } from 'react-use';
import { SidebarPortal } from '../sidebar-portal/sidebar-portal';
import { Drawer } from '../drawer/drawer';
import { DrawerContent } from '../drawer/drawer-content';
import { useSidebarContext } from '../sidebar-context/use-sidebar-context';
import type { SidebarMenuItem, SidebarBaseProps } from './types';
import { SidebarMenu } from './sidebar-menu';

export type { SidebarMenuItem };
export type SidebarProps = SidebarBaseProps;

export const Sidebar: FC<SidebarProps> = ({
  bottomArea,
  items,
}) => {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebarContext();
  const isMobile = useMedia('(max-width: 640px)', false);

  if (isMobile) {
    return (
      <Drawer open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DrawerContent
          isFullHeight
          maxHeight="calc(100dvh - 56px)"
          // The footer's rendered height: two navigation items
          // plus the gap and the footer's own top padding.
          reservedFooterHeight={123}
          contentClassName="px-3 pb-6"
          footerArea={bottomArea && (
            <div className="flex flex-col gap-1.5">
              {bottomArea}
            </div>
          )}
        >
          {/* <Drawer.Title className="sr-only">Navigation</Drawer.Title> */}
          <nav>
            <ul className="flex flex-col gap-2">
              {items.map(({ key, content }) => {
                return <li key={key}>{content}</li>;
              })}
            </ul>
          </nav>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
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
  );
};
