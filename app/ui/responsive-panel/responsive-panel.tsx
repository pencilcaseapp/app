import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { createContext, use } from 'react';
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
 */
export const ResponsivePanel: FC<ResponsivePanelProps> = (
  { children, ...rest },
) => {
  const isMobile = useIsMobile();
  const Root = isMobile ? Drawer : DropdownMenu;

  return (
    <IsDrawerContext value={isMobile}>
      <Root {...rest}>{children}</Root>
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
