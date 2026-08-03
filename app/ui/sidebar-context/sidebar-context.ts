import { createContext, type RefObject } from 'react';

export type SidebarContextType = {
  isSidebarOpen: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
  closeOnNavigate: () => void;
};

export const SidebarContext = createContext<SidebarContextType | null>(null);
