import { type FC } from 'react';
import { SidebarPortal } from '../sidebar-portal/sidebar-portal';
import type { SidebarMenuItem, SidebarBaseProps } from './types';
import { SidebarMenu } from './sidebar-menu';

export type { SidebarMenuItem };
export type SidebarProps = SidebarBaseProps;

export const Sidebar: FC<SidebarProps> = ({
  bottomArea,
  items,
}) => {
  return (
    <SidebarPortal
      mobileChildren={(
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
