import type { FC, PropsWithChildren, ReactNode } from 'react';
import { DialogContent } from '~/ui/dialog/dialog-content';
import type { DialogSize } from '~/ui/dialog/dialog-content';
import { DrawerContent } from '~/ui/drawer/drawer-content';
import { useIsDrawer } from './responsive-dialog';

export type ResponsiveDialogContentProps = {
  topArea?: ReactNode;
  footerArea?: ReactNode;
  isFullHeight?: boolean;
  /** Dialog only. */
  size?: DialogSize;
  /** Dialog only. */
  sideArea?: ReactNode;
  /** Dialog only. */
  className?: string;
  /** Drawer only. */
  reservedFooterHeight?: number;
  /** Drawer only. */
  minHeight?: string;
} & PropsWithChildren;

export const ResponsiveDialogContent: FC<ResponsiveDialogContentProps> = ({
  children,
  topArea,
  footerArea,
  isFullHeight,
  size,
  sideArea,
  className,
  reservedFooterHeight,
  minHeight,
}) => {
  const isDrawer = useIsDrawer();

  if (isDrawer) {
    return (
      <DrawerContent
        topArea={topArea}
        footerArea={footerArea}
        isFullHeight={isFullHeight}
        reservedFooterHeight={reservedFooterHeight}
        minHeight={minHeight}
      >
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent
      topArea={topArea}
      footerArea={footerArea}
      isFullHeight={isFullHeight}
      size={size}
      sideArea={sideArea}
      className={className}
    >
      {children}
    </DialogContent>
  );
};
