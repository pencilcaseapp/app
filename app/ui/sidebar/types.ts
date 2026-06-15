import type { ReactNode } from 'react';

export type SidebarMenuItem = {
  key: string;
  content: ReactNode;
};

export type SidebarBaseProps = {
  bottomArea?: ReactNode;
  items: SidebarMenuItem[];
  showSlimSidebar?: boolean;
};
