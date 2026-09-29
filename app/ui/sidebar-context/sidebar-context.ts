import { createContext, type RefObject } from 'react';

export type SidebarContextType = {
  /** Whether the sidebar is open at the current width. */
  isSidebarOpen: boolean;
  /**
   * Whether the desktop sidebar is open, known before the width is: the
   * server renders the desktop sidebar with it.
   */
  isDesktopSidebarOpen: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
  closeOnNavigate: () => void;
};

export const SidebarContext = createContext<SidebarContextType | null>(null);
