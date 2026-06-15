import { createContext, type RefObject } from 'react';

export type SidebarContextType = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export const SidebarContext = createContext<SidebarContextType | null>(null);
