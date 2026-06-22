import classNames from 'classnames';
import type { FC, ReactNode } from 'react';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';
import { Typography, type TypographyProps } from '../typography/typography';

export type NotificationVariant = 'info' | 'success' | 'warning' | 'danger';

export type NotificationProps = {
  className?: string;
  variant?: NotificationVariant;
  title: ReactNode;
  description?: ReactNode;
};

const iconMapping: { [index in NotificationVariant]: IconName } = {
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'danger',
};

const textColorMapping: { [index in NotificationVariant]: NonNullable<TypographyProps['textColorLight']> } = {
  info: 'blue-900',
  success: 'green-900',
  warning: 'orange-900',
  danger: 'red-900',
};

export const Notification: FC<NotificationProps> = ({
  className,
  title,
  description,
  variant = 'info',
}) => {
  const textColor = textColorMapping[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={classNames([
        'flex items-start justify-between rounded-xl border',
        variant === 'info' && 'bg-pca-blue-300 border-pca-blue-900',
        variant === 'success' && 'bg-pca-green-300 border-pca-green-900',
        variant === 'warning' && 'bg-pca-orange-300 border-pca-orange-900',
        variant === 'danger' && 'bg-pca-red-300 border-pca-red-900',
        'pl-3 pr-8 py-3',
        className,
      ])}
    >
      <Icon
        icon={iconMapping[variant]}
        className={classNames([
          variant === 'info' && 'text-pca-blue-900',
          variant === 'success' && 'text-pca-green-900',
          variant === 'warning' && 'text-pca-orange-900',
          variant === 'danger' && 'text-pca-red-900',
          'mr-3 shrink-0 self-start',
        ])}
      />
      <div className="flex flex-col gap-1 grow pt-0.5">
        <Typography
          variant="bodySmall"
          fontWeight="semibold"
          textColorDark={textColor}
          textColorLight={textColor}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="bodySmall"
            className="mb-1"
            textColorDark={textColor}
            textColorLight={textColor}
          >
            {description}
          </Typography>
        )}
      </div>
    </div>
  );
};
