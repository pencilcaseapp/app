import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type {
  DialogPortalProps,
  DialogBackdropProps,
  DialogViewportProps,
  DialogPopupProps,
} from '@base-ui/react';
import type { FC, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';

export type DialogSize = 'small' | 'medium' | 'large';

export type DialogContentProps = {
  dialogPortalProps?: DialogPortalProps;
  dialogBackdropProps?: DialogBackdropProps;
  dialogViewportProps?: DialogViewportProps;
  dialogPopupProps?: DialogPopupProps;
  topArea?: ReactNode;
  sideArea?: ReactNode;
  footerArea?: ReactNode;
  size?: DialogSize;
  isFullHeight?: boolean;
  className?: string;
} & PropsWithChildren;

const sizeClasses: { [index in DialogSize]: string } = {
  small: 'max-w-sm',
  medium: 'max-w-lg',
  large: 'max-w-3xl',
};

export const DialogContent: FC<DialogContentProps>
  = ({
    children,
    dialogPortalProps,
    dialogBackdropProps,
    dialogViewportProps,
    dialogPopupProps,
    topArea,
    sideArea,
    footerArea,
    size = 'medium',
    isFullHeight = false,
    className,
  }) => {
    return (
      <BaseDialog.Portal {...dialogPortalProps}>
        <BaseDialog.Backdrop {...dialogBackdropProps} className="[--backdrop-opacity:0.2] fixed inset-0 min-h-dvh bg-pca-grey-700 opacity-(--backdrop-opacity) transition-opacity duration-150 dark:[--backdrop-opacity:0.7] data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none" />
        <BaseDialog.Viewport {...dialogViewportProps} className="fixed inset-0 flex items-center justify-center p-4">
          <BaseDialog.Popup
            {...dialogPopupProps}
            className={classNames(
              'relative flex w-full max-h-full flex-col overflow-hidden rounded-3xl bg-pca-white outline-none shadow-glass transition-[scale,opacity] duration-100 ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0 motion-reduce:transition-none dark:border dark:border-pca-grey-800 dark:bg-pca-grey-900 dark:shadow-glass-dark',
              sizeClasses[size],
              isFullHeight && 'h-[32.5rem]',
              className,
            )}
          >
            {topArea && (
              <div className="shrink-0">
                {topArea}
              </div>
            )}
            <div className="flex min-h-0 flex-1">
              {sideArea && (
                <div className="shrink-0 overflow-y-auto overscroll-contain p-4">
                  {sideArea}
                </div>
              )}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                  {children}
                </div>
                {footerArea && (
                  <div className="shrink-0 p-4">
                    {footerArea}
                  </div>
                )}
              </div>
            </div>
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    );
  };
