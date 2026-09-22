import { Typography } from '../typography/typography';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';
import classNames from 'classnames';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';
import { Tooltip } from '../tooltip/tooltip';
import { useIconOnly } from './icon-only-context';
import { useMedia } from 'react-use';

type TypographyColorProps
  = Pick<React.ComponentProps<typeof Typography>,
    'textColorLight' | 'textColorDark'>;

export type DocumentItemProps<C extends React.ElementType>
  = PolymorphicComponentPropWithRef<
    C,
    {
      title?: string;
      actionArea?: React.ReactNode;
      /** Keeps the action area visible instead of revealing it on hover. */
      isActionAreaVisible?: boolean;
      icon: IconName;
      iconOnly?: boolean;
    } & TypographyColorProps
  >;

export function NavigationItem<C extends React.ElementType = 'a'>(
  { as = 'a' as C,
    title,
    icon,
    actionArea,
    isActionAreaVisible,
    className,
    iconOnly,
    textColorLight,
    textColorDark,
    ref,
    ...rest }: DocumentItemProps<C>,
) {
  const iconOnlyFromContext = useIconOnly();
  const isIconOnly = iconOnly ?? iconOnlyFromContext;

  const wrapperClasses = classNames([
    'transition-all group relative flex items-center justify-between gap-2 h-12 lg:h-10 pl-3 lg:pl-2 pr-0.5 rounded-xl cursor-pointer active:scale-[0.98]',
    'has-aria-[current=page]:bg-pca-grey-200 dark:has-aria-[current=page]:bg-pca-grey-800',
    'hover:bg-pca-grey-100 dark:hover:bg-pca-grey-800',
    'active:bg-pca-grey-100 dark:active:bg-pca-grey-800',
    'has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50',
    isIconOnly && 'w-10 pr-2',
    className,
  ]);

  const Component = as as React.ElementType;
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)');

  // The `::before` stretches the link over the whole row, so the padding,
  // the gap and the space the action area sits in navigate too instead of
  // swallowing the click. The action area is positioned to stay on top of
  // it, which keeps the two apart without nesting a button in the link.
  const linkClasses = 'flex items-center gap-2 min-w-0 flex-1 py-1 focus:outline-none before:content-[\'\'] before:absolute before:inset-0 before:rounded-xl';

  return (
    <>
      {isIconOnly
        ? (
            <Tooltip tooltip={title ?? ''} side="right">
              <div className={wrapperClasses}>
                <Component
                  {...rest}
                  ref={ref}
                  className={linkClasses}
                >
                  <Icon icon={icon} />
                </Component>
              </div>
            </Tooltip>
          )
        : (
            <div className={wrapperClasses}>
              <Component
                {...rest}
                ref={ref}
                title={title}
                className={linkClasses}
              >
                <Icon icon={icon} />
                <Typography
                  variant="bodySmall"
                  as="span"
                  textAlign="left"
                  textColorLight={textColorLight}
                  textColorDark={textColorDark}
                  className="block truncate min-w-0 flex-1"
                >
                  {title}
                </Typography>
              </Component>
              {actionArea && (
                <div className={classNames([
                  'relative shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 has-data-[state=open]:opacity-100 transition-opacity',
                  (isTouchDevice || isActionAreaVisible) && 'opacity-100',
                ])}
                >
                  {actionArea}
                </div>
              )}
            </div>
          )}
    </>
  );
};
