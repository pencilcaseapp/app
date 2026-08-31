import type { FC, PropsWithChildren } from 'react';
import { DialogContent } from '~/ui/dialog/dialog-content';
import type { DialogSize } from '~/ui/dialog/dialog-content';
import { DrawerContent } from '~/ui/drawer/drawer-content';
import { useIsDrawer } from './responsive-dialog';

export type ResponsiveDialogContentProps = {
  isFullHeight?: boolean;
  /** Dialog only. */
  size?: DialogSize;
  /** Dialog only. */
  className?: string;
  /** Drawer only. */
  maxHeight?: string;
  /** Drawer only. */
  minHeight?: string;
} & PropsWithChildren;

/*
 * The popup of the active `ResponsiveDialog` variant. It only provides
 * the popup surface; the content structure inside comes from
 * `ResponsiveDialogContentInner`.
 */
export const ResponsiveDialogContent: FC<ResponsiveDialogContentProps> = ({
  children,
  isFullHeight,
  size,
  className,
  maxHeight,
  minHeight,
}) => {
  const isDrawer = useIsDrawer();

  if (isDrawer) {
    return (
      <DrawerContent
        isFullHeight={isFullHeight}
        maxHeight={maxHeight}
        minHeight={minHeight}
      >
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent
      isFullHeight={isFullHeight}
      size={size}
      className={className}
    >
      {children}
    </DialogContent>
  );
};
