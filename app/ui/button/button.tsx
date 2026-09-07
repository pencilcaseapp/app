import classNames from 'classnames';
import { Typography } from '../typography/typography';
import type { IconName } from '../icon/icons';
import { LoadingIndicator } from '../loading-indicator/loading-indicator';
import { Icon } from '../icon/icon';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';

/**
 * Named after the resting fill, like the `textColor*` props of
 * `Typography`, so a look can be pinned to either theme:
 * `colorLight="grey-900" colorDark="grey-900"` keeps the dark fill on
 * a surface that does not follow the theme, e.g. the yellow pricing
 * card. `transparent` and `glass` have no fill to contrast against, so
 * their text follows the theme instead.
 */
export type ButtonColor
  = 'grey-900' | 'white' | 'transparent' | 'glass' | 'yellow-500' | 'red-500';

type Look = { enabled: string; disabled: string };

// Tailwind only picks up complete class names, so every look is spelled
// out twice: once for the light side and once behind `dark:`.
const LOOKS: Record<ButtonColor, { light: Look; dark: Look }> = {
  'grey-900': {
    light: {
      enabled: 'bg-pca-grey-900 text-pca-white hover:bg-pca-grey-800 active:bg-pca-grey-800',
      disabled: 'bg-pca-grey-300 text-pca-grey-600',
    },
    dark: {
      enabled: 'dark:bg-pca-grey-900 dark:text-pca-white dark:hover:bg-pca-grey-800 dark:active:bg-pca-grey-800',
      disabled: 'dark:bg-pca-grey-300 dark:text-pca-grey-600',
    },
  },
  'white': {
    light: {
      enabled: 'bg-pca-white text-pca-grey-900 hover:bg-pca-grey-300 active:bg-pca-grey-300',
      disabled: 'bg-pca-grey-800 text-pca-grey-400',
    },
    dark: {
      enabled: 'dark:bg-pca-white dark:text-pca-grey-900 dark:hover:bg-pca-grey-300 dark:active:bg-pca-grey-300',
      disabled: 'dark:bg-pca-grey-800 dark:text-pca-grey-400',
    },
  },
  'transparent': {
    light: {
      enabled: 'bg-transparent text-pca-grey-900 hover:bg-pca-grey-200 active:bg-pca-grey-200',
      disabled: 'bg-transparent text-pca-grey-500',
    },
    dark: {
      enabled: 'dark:bg-transparent dark:text-pca-white dark:hover:bg-pca-grey-800 dark:active:bg-pca-grey-800',
      disabled: 'dark:bg-transparent dark:text-pca-grey-500',
    },
  },
  'glass': {
    light: {
      enabled: 'bg-pca-white/75 backdrop-blur-lg backdrop-saturate-150 text-pca-grey-900 hover:bg-pca-grey-200 active:bg-pca-grey-200',
      disabled: 'bg-pca-white/75 backdrop-blur-lg backdrop-saturate-150 text-pca-grey-500',
    },
    dark: {
      enabled: 'dark:bg-pca-grey-900/55 dark:text-pca-white dark:hover:bg-pca-grey-800 dark:active:bg-pca-grey-800',
      disabled: 'dark:bg-pca-grey-900/55 dark:text-pca-grey-500',
    },
  },
  'yellow-500': {
    light: {
      enabled: 'bg-pca-yellow-500 text-pca-grey-900 hover:bg-pca-yellow-700 active:bg-pca-yellow-700',
      disabled: 'bg-pca-yellow-300 text-pca-yellow-900',
    },
    dark: {
      enabled: 'dark:bg-pca-yellow-500 dark:text-pca-grey-900 dark:hover:bg-pca-yellow-700 dark:active:bg-pca-yellow-700',
      disabled: 'dark:bg-pca-yellow-900 dark:text-pca-yellow-300',
    },
  },
  'red-500': {
    light: {
      enabled: 'bg-pca-red-500 text-pca-white hover:bg-pca-red-700 active:bg-pca-red-700',
      disabled: 'bg-pca-red-300 text-pca-red-900',
    },
    dark: {
      enabled: 'dark:bg-pca-red-500 dark:text-pca-white dark:hover:bg-pca-red-700 dark:active:bg-pca-red-700',
      disabled: 'dark:bg-pca-red-900 dark:text-pca-red-300',
    },
  },
};

// The dark look a light look pairs with unless `colorDark` says otherwise.
const DARK_DEFAULT: Record<ButtonColor, ButtonColor> = {
  'grey-900': 'white',
  'white': 'grey-900',
  'transparent': 'transparent',
  'glass': 'glass',
  'yellow-500': 'yellow-500',
  'red-500': 'red-500',
};

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
    colorLight = 'grey-900',
    colorDark = DARK_DEFAULT[colorLight],
    icon,
    iconPosition = 'end',
    className,
    iconTitle,
    onClick,
    ref,
    ...props
  }: ButtonProps<C>,
) {
  const state = disabled ? 'disabled' : 'enabled';

  const colorClasses = classNames([
    'transition-[background-color,color,box-shadow,scale]',
    'duration-150 ease-out motion-reduce:transition-none h-11 lg:h-9',
    'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-pca-grey-500',
    (disabled || isLoading)
    && 'pointer-events-none',
    LOOKS[colorLight].light[state],
    LOOKS[colorDark].dark[state],
  ]);

  const baseShapeClasses = classNames([
    'rounded-xl px-4 py-2 lg:px-3',
  ]);

  const iconOnlyClasses = classNames([
    'rounded-xl w-11 lg:w-9',
    'py-0',
    'px-0',
  ]);
  const isOnlyIcon = !children && icon;

  const classes = classNames([
    'relative overflow-hidden',
    'active:scale-[0.96] motion-reduce:active:scale-100',
    'flex items-center justify-center',
    'gap-2',
    isOnlyIcon ? iconOnlyClasses : baseShapeClasses,
    iconPosition === 'start' && 'flex-row-reverse',
    iconPosition === 'end' && 'flex-row',
    colorClasses,
    className,
  ]);

  const hideClasses = classNames([
    isLoading && 'opacity-0 pointer-events-none',
  ]);

  const Component = as || 'button';

  // `pointer-events-none` only stops the mouse; a focused button still
  // fires on Enter and Space, so a loading button has to swallow the click
  // itself. The native `disabled` attribute would do that too, but it drops
  // focus to the body mid-submit.
  const handleClick = (event: React.MouseEvent) => {
    if (isLoading) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  return (
    <Component
      className={classes}
      disabled={disabled}
      aria-disabled={disabled || isLoading || undefined}
      aria-busy={isLoading || undefined}
      {...props}
      onClick={handleClick}
      ref={ref}
    >
      {children && (
        <Typography
          className={classNames('text-inherit! leading-none', hideClasses)}
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
            isOnlyIcon ? 'w-6 h-6' : 'w-4.5 h-4.5',
          ]])}
        />
      )}
    </Component>
  );
};
