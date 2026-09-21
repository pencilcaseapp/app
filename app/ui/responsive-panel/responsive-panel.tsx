import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { createContext, use, useState } from 'react';
import type { FC, PropsWithChildren, ReactElement } from 'react';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { Drawer } from '~/ui/drawer/drawer';
import { DropdownMenu } from '~/ui/dropdown-menu/dropdown-menu';
import { DropdownMenuTrigger } from '~/ui/dropdown-menu/dropdown-menu-trigger';

export type ResponsivePanelProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
} & PropsWithChildren;

const IsDrawerContext = createContext(false);

export const useIsPanelDrawer = () => use(IsDrawerContext);

/*
 * A panel hanging off a trigger: the bottom sheet drawer below Tailwind's
 * `sm` breakpoint and a dropdown menu anchored to the trigger everywhere
 * else. The same mechanic as `ResponsiveDialog` — the chosen variant is
 * shared through context, so the trigger and `ResponsivePanelContent`
 * always match the root.
 *
 * Radix closes a menu as soon as the window loses focus, which takes the
 * panel away the moment you switch to another tab to fetch something to
 * paste into it. A panel holds a form rather than commands, so it stays
 * open and is closed on purpose instead: the trigger, the backdrop, a
 * click outside and Escape all reach it while the document still has the
 * focus, and a window that lost it closes nothing. The root is therefore
 * controlled either way, so an uncontrolled panel behaves the same.
 */
export const ResponsivePanel: FC<ResponsivePanelProps> = ({
  children,
  open,
  defaultOpen,
  onOpenChange,
}) => {
  const isMobile = useIsMobile();
  const [panelOpen, setPanelOpen] = useState(defaultOpen ?? false);
  const isOpen = open ?? panelOpen;
  const Root = isMobile ? Drawer : DropdownMenu;

  const handleOpenChange = (next: boolean) => {
    if (!next && !document.hasFocus()) {
      return;
    }

    setPanelOpen(next);
    onOpenChange?.(next);
  };

  return (
    <IsDrawerContext value={isMobile}>
      <Root open={isOpen} onOpenChange={handleOpenChange}>{children}</Root>
    </IsDrawerContext>
  );
};

export type ResponsivePanelTriggerProps = {
  children: ReactElement;
};

export const ResponsivePanelTrigger: FC<ResponsivePanelTriggerProps> = (
  { children },
) => {
  return useIsPanelDrawer()
    ? <BaseDrawer.Trigger render={children} />
    : <DropdownMenuTrigger>{children}</DropdownMenuTrigger>;
};
