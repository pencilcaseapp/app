import type { FC, PropsWithChildren, ReactNode } from 'react';
import { DialogContentInner } from '~/ui/dialog/dialog-content-inner';
import { DrawerContentInner } from '~/ui/drawer/drawer-content-inner';
import { useIsDrawer } from './responsive-dialog';

export type ResponsiveDialogContentInnerProps = {
  topArea?: ReactNode;
  footerArea?: ReactNode;
  /** Dialog only. */
  sideArea?: ReactNode;
  /** Drawer only. */
  reservedFooterHeight?: number;
} & PropsWithChildren;

/*
 * The content structure inside a `ResponsiveDialogContent` popup. It is
 * a separate component so routes rendered inside a shared popup can each
 * bring their own topbar, side area and footer while the popup stays
 * mounted.
 */
export const ResponsiveDialogContentInner: FC<
  ResponsiveDialogContentInnerProps
> = ({
  children,
  topArea,
  footerArea,
  sideArea,
  reservedFooterHeight,
}) => {
  const isDrawer = useIsDrawer();

  if (isDrawer) {
    return (
      <DrawerContentInner
        topArea={topArea}
        footerArea={footerArea}
        reservedFooterHeight={reservedFooterHeight}
      >
        {children}
      </DrawerContentInner>
    );
  }

  return (
    <DialogContentInner
      topArea={topArea}
      footerArea={footerArea}
      sideArea={sideArea}
    >
      {children}
    </DialogContentInner>
  );
};
