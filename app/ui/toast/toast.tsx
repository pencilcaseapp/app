import { Toast as BaseToast } from '@base-ui/react/toast';
import classNames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';
import { Typography, type TypographyProps } from '../typography/typography';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export type ToastProps = {
  className?: string;
  toast: BaseToast.Root.ToastObject;
};

const iconMapping: { [index in ToastVariant]: IconName } = {
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'danger',
};

const textColorMapping: {
  [index in ToastVariant]: NonNullable<TypographyProps['textColorLight']>;
} = {
  info: 'blue-900',
  success: 'green-900',
  warning: 'orange-900',
  danger: 'red-900',
};

const toVariant = (type: string | undefined): ToastVariant =>
  type && type in iconMapping ? type as ToastVariant : 'info';

export const Toast: FC<ToastProps> = ({ className, toast }) => {
  const variant = toVariant(toast.type);
  const textColor = textColorMapping[variant];

  return (
    <BaseToast.Root
      toast={toast}
      className={classNames([
        'flex w-[285px] max-w-[calc(100vw-2rem)] items-center gap-3',
        'rounded-3xl border py-3 pl-3 pr-8',
        variant === 'info' && 'bg-pca-blue-300 border-pca-blue-900',
        variant === 'success' && 'bg-pca-green-300 border-pca-green-900',
        variant === 'warning' && 'bg-pca-orange-300 border-pca-orange-900',
        variant === 'danger' && 'bg-pca-red-300 border-pca-red-900',
        'animate-toast-slide-in data-ending-style:animate-toast-slide-out',
        'motion-reduce:animate-none',
        className,
      ])}
    >
      <Icon
        icon={iconMapping[variant]}
        className={classNames([
          'shrink-0',
          variant === 'info' && 'text-pca-blue-900',
          variant === 'success' && 'text-pca-green-900',
          variant === 'warning' && 'text-pca-orange-900',
          variant === 'danger' && 'text-pca-red-900',
        ])}
      />
      <BaseToast.Title
        render={(
          <Typography
            as="h2"
            variant="bodySmall"
            fontWeight="semibold"
            textAlign="center"
            textColorLight={textColor}
            textColorDark={textColor}
            className="grow break-words"
          />
        )}
      />
    </BaseToast.Root>
  );
};

export const ToastViewport: FC = () => {
  const { toasts } = BaseToast.useToastManager();

  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className="fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 flex-col-reverse items-center gap-2 p-4 outline-hidden">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
};

export const ToastProvider: FC<PropsWithChildren> = ({ children }) => (
  <BaseToast.Provider>
    {children}
    <ToastViewport />
  </BaseToast.Provider>
);
