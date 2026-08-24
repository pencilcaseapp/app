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

export type DialogPadding = 'none' | 'small' | 'medium' | 'large';

export type DialogContentProps = {
  dialogPortalProps?: DialogPortalProps;
  dialogBackdropProps?: DialogBackdropProps;
  dialogViewportProps?: DialogViewportProps;
  dialogPopupProps?: DialogPopupProps;
  topArea?: ReactNode;
  footerArea?: ReactNode;
  size?: DialogSize;
  padding?: DialogPadding;
  isFullHeight?: boolean;
  className?: string;
} & PropsWithChildren;

const sizeClasses: { [index in DialogSize]: string } = {
  small: 'max-w-sm',
  medium: 'max-w-lg',
  large: 'max-w-3xl',
};

/*
 * The padding of the content and footer areas. The gap is what separates
 * those areas from the topbar and from each other, and stays smaller than
 * the padding because both of them already bring their own.
 */
const paddingClasses: { [index in DialogPadding]: string } = {
  none: '[--dialog-padding:0rem] [--dialog-gap:0rem]',
  small: '[--dialog-padding:1rem] [--dialog-gap:0.5rem]',
  medium: '[--dialog-padding:1.5rem] [--dialog-gap:0.5rem]',
  large: '[--dialog-padding:2rem] [--dialog-gap:0.75rem]',
};

export const DialogContent: FC<DialogContentProps>
  = ({
    children,
    dialogPortalProps,
    dialogBackdropProps,
    dialogViewportProps,
    dialogPopupProps,
    topArea,
    footerArea,
    size = 'medium',
    padding = 'medium',
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
              paddingClasses[padding],
              isFullHeight && 'h-[32.5rem]',
              className,
            )}
          >
            {topArea && (
              <div className="shrink-0">
                {topArea}
              </div>
            )}
            <div
              className={classNames(
                'min-h-0 flex-1 overflow-y-auto overscroll-contain px-(--dialog-padding)',
                topArea ? 'pt-(--dialog-gap)' : 'pt-(--dialog-padding)',
                footerArea ? 'pb-(--dialog-gap)' : 'pb-(--dialog-padding)',
              )}
            >
              {children}
            </div>
            {footerArea && (
              <div className="shrink-0 px-(--dialog-padding) pt-(--dialog-gap) pb-(--dialog-padding)">
                {footerArea}
              </div>
            )}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    );
  };
