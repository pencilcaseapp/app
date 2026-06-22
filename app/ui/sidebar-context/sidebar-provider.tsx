import { useCallback, useRef, useState, type FC, type PropsWithChildren } from 'react';
import { useLocalStorage, useMedia } from 'react-use';
import { SidebarContext } from './sidebar-context';

const SIDEBAR_STORAGE_KEY = 'sidebar:is-open';

export const SidebarProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const isDesktop = useMedia('(min-width: 1280px)', false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useLocalStorage(
    SIDEBAR_STORAGE_KEY,
    true,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const normalizedDesktopSidebarOpen = typeof desktopSidebarOpen === 'boolean'
    ? desktopSidebarOpen
    : true;

  const isSidebarOpen = isDesktop
    ? normalizedDesktopSidebarOpen
    : mobileSidebarOpen;

  const setIsSidebarOpen = useCallback((next: boolean) => {
    if (isDesktop) {
      setDesktopSidebarOpen(next);
      return;
    }

    setMobileSidebarOpen(next);
  }, [isDesktop, setDesktopSidebarOpen]);

  return (
    <SidebarContext
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        triggerRef,
      }}
    >
      {children}
    </SidebarContext>
  );
};
