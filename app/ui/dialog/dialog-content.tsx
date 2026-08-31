import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type {
  DialogPortalProps,
  DialogBackdropProps,
  DialogViewportProps,
  DialogPopupProps,
} from '@base-ui/react';
import type { FC, PropsWithChildren } from 'react';
import classNames from 'classnames';

export type DialogSize = 'small' | 'large';

export type DialogContentProps = {
  dialogPortalProps?: DialogPortalProps;
  dialogBackdropProps?: DialogBackdropProps;
  dialogViewportProps?: DialogViewportProps;
  dialogPopupProps?: DialogPopupProps;
  size?: DialogSize;
  isFullHeight?: boolean;
  className?: string;
} & PropsWithChildren;

const sizeClasses: { [index in DialogSize]: string } = {
  small: 'max-w-sm',
  large: 'max-w-3xl',
};

/*
 * The portal, backdrop, viewport and popup of a dialog. It only provides
 * the popup surface; the content structure inside comes from
 * `DialogContentInner`, so a dialog driven by nested routes can keep the
 * popup mounted while the routes swap the structure within.
 */
export const DialogContent: FC<DialogContentProps>
  = ({
    children,
    dialogPortalProps,
    dialogBackdropProps,
    dialogViewportProps,
    dialogPopupProps,
    size = 'small',
    isFullHeight = false,
    className,
  }) => {
    return (
      <BaseDialog.Portal {...dialogPortalProps}>
        <BaseDialog.Backdrop {...dialogBackdropProps} className="[--backdrop-opacity:0.2] fixed inset-0 z-50 min-h-dvh bg-pca-grey-700 opacity-(--backdrop-opacity) transition-opacity duration-150 dark:[--backdrop-opacity:0.7] data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none" />
        <BaseDialog.Viewport {...dialogViewportProps} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <BaseDialog.Popup
            {...dialogPopupProps}
            className={classNames(
              'relative flex w-full max-h-full flex-col overflow-hidden rounded-3xl bg-pca-white outline-none shadow-glass transition-[scale,opacity] duration-100 ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0 motion-reduce:transition-none dark:border dark:border-pca-grey-800 dark:bg-pca-grey-900 dark:shadow-glass-dark',
              sizeClasses[size],
              isFullHeight && 'h-130',
              className,
            )}
          >
            {children}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    );
  };
