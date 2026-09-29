import { useCallback, useRef, useState, type FC, type PropsWithChildren } from 'react';
import { useMedia } from 'react-use';
import { SidebarContext } from './sidebar-context';

export type SidebarProviderProps = PropsWithChildren & {
  /**
   * Whether the desktop sidebar starts open. It comes from the server, so
   * the page is rendered with the sidebar the way the reader left it.
   */
  defaultDesktopOpen?: boolean;
  /** Keeps the desktop choice for the next page load. */
  onDesktopOpenChange?: (isOpen: boolean) => void;
};

export const SidebarProvider: FC<SidebarProviderProps> = ({
  defaultDesktopOpen = true,
  onDesktopOpenChange,
  children,
}) => {
  const isDesktop = useMedia('(min-width: 1280px)', false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen]
    = useState(defaultDesktopOpen);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isSidebarOpen = isDesktop ? isDesktopSidebarOpen : mobileSidebarOpen;

  const setIsSidebarOpen = useCallback((next: boolean) => {
    if (isDesktop) {
      setIsDesktopSidebarOpen(next);
      onDesktopOpenChange?.(next);
      return;
    }

    setMobileSidebarOpen(next);
  }, [isDesktop, onDesktopOpenChange]);

  const closeOnNavigate = useCallback(() => {
    if (!isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  return (
    <SidebarContext
      value={{
        isSidebarOpen,
        isDesktopSidebarOpen,
        setIsSidebarOpen,
        triggerRef,
        closeOnNavigate,
      }}
    >
      {children}
    </SidebarContext>
  );
};
