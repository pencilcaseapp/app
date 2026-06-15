import { use } from 'react';
import { SidebarContext } from './sidebar-context';

export const useSidebarContext = () => {
  const context = use(SidebarContext);

  if (!context) {
    throw new Error(
      'useSidebarContext must be used within a SidebarProvider',
    );
  }
  return context;
};
