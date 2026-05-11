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
      colorLight?: ButtonColor;
      colorDark?: ButtonColor;
      disabled?: boolean;
      iconPosition?: 'start' | 'end';
      icon?: IconName;
      iconTitle?: string;
      className?: string;
    }
  >;

export function Button<C extends React.ElementType = 'button'>(
  {
    as,
    children,
    isLoading,
    disabled,
    colorLight = 'primary',
    colorDark,
    icon,
    iconPosition = 'end',
    className,
    iconTitle,
    ref,
    ...props
  }: ButtonProps<C>,
) {
  /*
     * Filled Variants
     */
  const filledClasses = classNames([
    'transition-all duration-300 ease-in-out h-9',
    (disabled || isLoading)
    && 'pointer-events-none',
  ]);

  const primaryLightFilledClasses = classNames([
    'text-pca-white',
    disabled && 'bg-pca-grey-300 focus:outline-hidden',
    !disabled
    && 'bg-pca-grey-900 hover:bg-pca-grey-800 focus:outline-hidden focus:ring-2 focus:ring-pca-grey-300',
  ]);

  const primaryDarkFilledClasses = classNames([
    'dark:text-pca-grey-900',
    disabled && 'dark:bg-pca-grey-800 dark:text-pca-grey-700! dark:focus:outline-hidden',
    !disabled
    && 'dark:bg-pca-white dark:hover:bg-pca-grey-300 dark:focus:outline-hidden dark:focus:ring-2 dark:focus:ring-pca-grey-300',
  ]);

  const secondaryLightFilledClasses = classNames([
    'text-pca-grey-900',
    disabled && 'text-pca-grey-300! focus:outline-hidden',
    !disabled
    && 'bg-transparent hover:bg-pca-grey-200 focus:outline-hidden focus:ring-2 focus:ring-pca-grey-300',
  ]);

  const secondaryDarkFilledClasses = classNames([
    'dark:text-pca-white',
    disabled && 'dark:text-pca-grey-700! dark:focus:outline-hidden',
    !disabled
    && 'dark:bg-transparent dark:hover:bg-pca-grey-800 dark:focus:outline-hidden dark:focus:ring-2 dark:focus:ring-pca-grey-700',
  ]);

  const upgradeLightFilledClasses = classNames([
    'text-pca-grey-900',
    disabled && 'bg-pca-yellow-300/50 text-pca-grey-300! focus:outline-hidden',
    !disabled
    && 'bg-pca-yellow-500 hover:bg-pca-yellow-700 focus:outline-hidden focus:ring-2 focus:ring-pca-yellow-300',
  ]);

  const upgradeDarkFilledClasses = classNames([
    'dark:text-pca-grey-900',
    disabled && 'dark:bg-pca-yellow-300/50 dark:text-pca-grey-300! dark:focus:outline-hidden',
    !disabled
    && 'dark:bg-pca-yellow-500 dark:hover:bg-pca-yellow-700 dark:focus:outline-hidden dark:focus:ring-2 dark:focus:ring-pca-yellow-300',
  ]);

  const dangerLightFilledClasses = classNames([
    'text-pca-white',
    disabled && 'bg-pca-red-300/50 text-pca-grey-300! focus:outline-hidden',
    !disabled
    && 'bg-pca-red-500 hover:bg-pca-red-700 focus:outline-hidden focus:ring-2 focus:ring-pca-red-300',
  ]);

  const dangerDarkFilledClasses = classNames([
    'dark:text-pca-white',
    disabled && 'dark:bg-pca-red-300/50 dark:text-pca-grey-300! dark:focus:outline-hidden',
    !disabled
    && 'dark:bg-pca-red-500 dark:hover:bg-pca-red-700 dark:focus:outline-hidden dark:focus:ring-2 dark:focus:ring-pca-red-300',
  ]);

  const colorClasses = classNames([
    colorLight === 'primary' && primaryLightFilledClasses,
    !colorDark && colorLight === 'primary' && primaryDarkFilledClasses,
    colorDark === 'primary' && primaryDarkFilledClasses,

    colorLight === 'secondary' && secondaryLightFilledClasses,
    !colorDark && colorLight === 'secondary' && secondaryDarkFilledClasses,
    colorDark === 'secondary' && secondaryDarkFilledClasses,

    colorLight === 'upgrade' && upgradeLightFilledClasses,
    !colorDark && colorLight === 'upgrade' && upgradeDarkFilledClasses,
    colorDark === 'upgrade' && upgradeDarkFilledClasses,

    colorLight === 'danger' && dangerLightFilledClasses,
    !colorDark && colorLight === 'danger' && dangerDarkFilledClasses,
    colorDark === 'danger' && dangerDarkFilledClasses,
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
};
