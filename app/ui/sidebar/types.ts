import type { ReactNode } from 'react';

export type SidebarBaseProps = {
  bottomArea?: ReactNode;
  /** What the sidebar lists above the bottom area. */
  content: ReactNode;
  showSlimSidebar?: boolean;
};
