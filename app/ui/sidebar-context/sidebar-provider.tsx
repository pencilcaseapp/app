import { useRef, useState, type FC, type PropsWithChildren } from 'react';
import { SidebarContext } from './sidebar-context';

export const SidebarProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <SidebarContext
      value={{
        isSidebarOpen: isSidebarOpen,
        setIsSidebarOpen,
        triggerRef,
      }}
    >
      {children}
    </SidebarContext>
  );
};
