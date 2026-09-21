import classNames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import { Typography, type TypographyProps } from '../typography/typography';

/** `neutral` follows the page theme, `dark` keeps the dark pill in
 * both themes for surfaces that do not follow it, e.g. the yellow
 * pricing card. */
export type BadgeVariant
  = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'dark';

/** `small` is the tighter pill the share panel puts next to a name,
 * where the badge sits inline with the text rather than on its own. */
export type BadgeSize = 'default' | 'small';

export type BadgeProps = PropsWithChildren<{
  className?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}>;

type TextColor = NonNullable<TypographyProps['textColorLight']>;

const textColorMapping: {
  [index in BadgeVariant]: { light: TextColor; dark: TextColor };
} = {
  info: { light: 'blue-900', dark: 'blue-900' },
  success: { light: 'green-900', dark: 'green-900' },
  warning: { light: 'orange-900', dark: 'orange-900' },
  danger: { light: 'red-700', dark: 'red-700' },
  neutral: { light: 'grey-900', dark: 'white' },
  dark: { light: 'white', dark: 'white' },
};

export const Badge: FC<BadgeProps> = ({
  className,
  variant = 'info',
  size = 'default',
  children,
}) => {
  const textColor = textColorMapping[variant];

  return (
    <span
      className={classNames([
        'inline-flex items-center justify-center rounded-full',
        size === 'default' && 'px-3 py-1',
        size === 'small' && 'px-2',
        variant === 'info' && 'bg-pca-blue-300',
        variant === 'success' && 'bg-pca-green-300',
        variant === 'warning' && 'bg-pca-orange-300',
        variant === 'danger' && 'bg-pca-red-300',
        variant === 'neutral' && 'bg-pca-grey-200 dark:bg-pca-grey-800',
        variant === 'dark' && 'bg-pca-grey-900',
        className,
      ])}
    >
      <Typography
        as="span"
        variant="bodyTiny"
        fontWeight="semibold"
        textColorLight={textColor.light}
        textColorDark={textColor.dark}
        className="leading-[18px] tracking-[0.02em]"
      >
        {children}
      </Typography>
    </span>
  );
};
