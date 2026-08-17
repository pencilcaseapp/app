import { Toast as BaseToast } from '@base-ui/react/toast';
import classNames from 'classnames';
import type { FC } from 'react';
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

/**
 * A single toast. Sizing and placement come from `ToastViewport`, the stacking
 * and the movement between its states from the `toast-stack` utility.
 */
export const Toast: FC<ToastProps> = ({ className, toast }) => {
  const variant = toVariant(toast.type);
  const textColor = textColorMapping[variant];

  return (
    <BaseToast.Root
      toast={toast}
      className={classNames([
        'toast-stack absolute inset-x-0 top-0 overflow-hidden',
        'flex max-w-[calc(100vw-1rem)] lg:max-w-lg items-center gap-3',
        'rounded-full border py-3 pl-3 pr-8',
        variant === 'info' && 'bg-pca-blue-300 border-pca-blue-900',
        variant === 'success' && 'bg-pca-green-300 border-pca-green-900',
        variant === 'warning' && 'bg-pca-orange-300 border-pca-orange-900',
        variant === 'danger' && 'bg-pca-red-300 border-pca-red-900',
        className,
      ])}
    >
      <BaseToast.Content
        className={classNames([
          'flex w-full items-center gap-3',
          // Only the frontmost toast shows its content while the stack is
          // collapsed; the ones behind fade back in once it expands.
          'transition-opacity duration-250 motion-reduce:transition-none',
          'data-behind:opacity-0 data-expanded:opacity-100',
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
      </BaseToast.Content>
    </BaseToast.Root>
  );
};
