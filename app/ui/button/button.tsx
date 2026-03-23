import { forwardRef } from 'react';
import classNames from 'classnames';
import { Typography } from '../typography/typography';
import type { IconName } from '../icon/icons';
import { LoadingIndicator } from '../loading-indicator/loading-indicator';
import { Icon } from '../icon/icon';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';

export type ButtonColor = 'primary' | 'secondary' | 'upgrade' | 'danger';

export type ButtonProps<C extends React.ElementType>
  = PolymorphicComponentPropWithRef<
    C,
    {
      isLoading?: boolean;
      color?: ButtonColor;
      disabled?: boolean;
      iconPosition?: 'start' | 'end';
      icon?: IconName;
      iconTitle?: string;
      className?: string;
    }
  >;

type ButtonComponent = <C extends React.ElementType = 'button'>(
  props: ButtonProps<C>,
) => React.ReactElement | null;

export const Button = forwardRef(
  <C extends React.ElementType = 'button'>(
    {
      as,
      children,
      isLoading,
      disabled,
      color = 'primary',
      icon,
      iconPosition = 'end',
      className,
      iconTitle,
      ...props
    }: ButtonProps<C>,
    ref?: unknown,
  ) => {
    /*
     * Filled Variants
     */
    const filledClasses = classNames([
      'transition-colors duration-300 ease-in-out h-9',
      (disabled || isLoading)
      && 'pointer-events-none',
    ]);

    const primaryFilledClasses = classNames([
      filledClasses,
      'text-pca-white dark:text-pca-grey-900 ',
      disabled && 'bg-pca-grey-300 dark:bg-pca-grey-800 dark:text-pca-grey-700! focus:outline-hidden',
      !disabled
      && 'bg-pca-grey-900 dark:bg-pca-white hover:bg-pca-grey-800 dark:hover:bg-pca-grey-300 focus:outline-hidden focus:ring-2 focus:ring-pca-grey-300',
    ]);

    const secondaryFilledClasses = classNames([
      filledClasses,
      'text-pca-grey-900 dark:text-pca-white',
      disabled && 'text-pca-grey-300! dark:text-pca-grey-700! focus:outline-hidden',
      !disabled
      && 'bg-transparent dark:bg-transparent hover:bg-pca-grey-200 dark:hover:bg-pca-grey-800 focus:outline-hidden focus:ring-2 focus:ring-pca-grey-300 dark:focus:ring-pca-grey-700',
    ]);

    const upgradeFilledClasses = classNames([
      filledClasses,
      'text-pca-grey-900',
      disabled && 'bg-pca-yellow-300/50 text-pca-grey-300! focus:outline-hidden',
      !disabled
      && 'bg-pca-yellow-500 hover:bg-pca-yellow-700 focus:outline-hidden focus:ring-2 focus:ring-pca-yellow-300',
    ]);

    const dangerFilledClasses = classNames([
      filledClasses,
      'text-pca-white',
      disabled && 'bg-pca-red-300/50 text-pca-grey-300! focus:outline-hidden',
      !disabled
      && 'bg-pca-red-500 hover:bg-pca-red-700 focus:outline-hidden focus:ring-2 focus:ring-pca-red-300 dark:focus:ring-pca-red-700',
    ]);

    const colorClasses = classNames([
      color === 'primary' && primaryFilledClasses,
      color === 'secondary' && secondaryFilledClasses,
      color === 'upgrade' && upgradeFilledClasses,
      color === 'danger' && dangerFilledClasses,
    ]);

    const baseShapeClasses = classNames([
      'rounded-xl px-3 py-2',
    ]);

    const iconOnlyClasses = classNames([
      'rounded-xl w-9 h-9',
      'py-0',
      'px-0',
    ]);
    const isOnlyIcon = !children && icon;

    const classes = classNames([
      'relative overflow-hidden',
      'flex items-center justify-center',
      'transition-colors duration-200 ease-in-out',
      'gap-2',
      filledClasses,
      isOnlyIcon ? iconOnlyClasses : baseShapeClasses,
      iconPosition === 'start' && 'flex-row-reverse',
      iconPosition === 'end' && 'flex-row',
      isLoading && 'pointer-events-none',
      colorClasses,
      className,
    ]);

    const hideClasses = classNames([
      isLoading && 'opacity-0 pointer-events-none',
    ]);

    const Component = as || 'button';

    return (
      <Component
        className={classes}
        disabled={disabled}
        {...props}
        ref={ref}
      >
        {children && (
          <Typography
            className={classNames('text-inherit! leading-none -translate-y-px', hideClasses)}
            variant="bodySmall"
            fontWeight="medium"
            as="span"
          >
            {children}
          </Typography>
        )}
        {isLoading && <LoadingIndicator className="absolute" />}
        {icon && (
          <Icon
            icon={icon}
            title={iconTitle}
            className={classNames([hideClasses, [
              'shrink-0',
              isOnlyIcon ? 'w-6 h-6' : 'w-4 h-4',
            ]])}
          />
        )}
      </Component>
    );
  },
) as ButtonComponent;
