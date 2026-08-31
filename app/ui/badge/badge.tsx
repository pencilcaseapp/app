import classNames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import { Typography, type TypographyProps } from '../typography/typography';

export type BadgeVariant = 'info' | 'success' | 'warning' | 'danger';

export type BadgeProps = PropsWithChildren<{
  className?: string;
  variant?: BadgeVariant;
}>;

const textColorMapping: {
  [index in BadgeVariant]: NonNullable<TypographyProps['textColorLight']>;
} = {
  info: 'blue-900',
  success: 'green-900',
  warning: 'orange-900',
  danger: 'red-700',
};

export const Badge: FC<BadgeProps> = ({
  className,
  variant = 'info',
  children,
}) => {
  const textColor = textColorMapping[variant];

  return (
    <span
      className={classNames([
        'inline-flex items-center justify-center rounded-full px-3 py-1',
        variant === 'info' && 'bg-pca-blue-300',
        variant === 'success' && 'bg-pca-green-300',
        variant === 'warning' && 'bg-pca-orange-300',
        variant === 'danger' && 'bg-pca-red-300',
        className,
      ])}
    >
      <Typography
        as="span"
        variant="bodyTiny"
        fontWeight="semibold"
        textColorLight={textColor}
        textColorDark={textColor}
        className="leading-[18px] tracking-[0.02em]"
      >
        {children}
      </Typography>
    </span>
  );
};
