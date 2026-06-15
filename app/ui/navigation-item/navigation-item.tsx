import { Typography } from '../typography/typography';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';
import classNames from 'classnames';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';
import { Tooltip } from '../tooltip/tooltip';
import { useIconOnly } from './icon-only-context';
import { useMedia } from 'react-use';

export type DocumentItemProps<C extends React.ElementType>
  = PolymorphicComponentPropWithRef<
    C,
    {
      title?: string;
      actionArea?: React.ReactNode;
      icon: IconName;
      iconOnly?: boolean;
    }
  >;

export function NavigationItem<C extends React.ElementType = 'a'>(
  { as = 'a' as C,
    title,
    icon,
    actionArea,
    className,
    iconOnly,
    ref,
    ...rest }: DocumentItemProps<C>,
) {
  const iconOnlyFromContext = useIconOnly();
  const isIconOnly = iconOnly ?? iconOnlyFromContext;

  const wrapperClasses = classNames([
    'transition-colors group h-9 flex items-center justify-between gap-2 pl-2 pr-0.5 rounded-xl cursor-pointer',
    'has-aria-[current=page]:bg-pca-grey-200 dark:has-aria-[current=page]:bg-pca-grey-800',
    'hover:bg-pca-grey-100 dark:hover:bg-pca-grey-800',
    'has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50',
    isIconOnly && 'w-10 pr-2',
    className,
  ]);

  const Component = as as React.ElementType;
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)');

  return (
    <>
      {isIconOnly
        ? (
            <Tooltip tooltip={title ?? ''} side="right">
              <div className={wrapperClasses}>
                <Component
                  {...rest}
                  ref={ref}
                  className="flex items-center gap-2 min-w-0 flex-1 py-1 focus:outline-none"
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
                className="flex items-center gap-2 min-w-0 flex-1 py-1 focus:outline-none"
              >
                <Icon icon={icon} />
                <Typography
                  variant="bodySmall"
                  as="span"
                  textAlign="left"
                  className="block truncate min-w-0 flex-1"
                  title={title}
                >
                  {title}
                </Typography>
              </Component>
              {actionArea && (
                <div className={classNames([
                  'shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 has-data-[state=open]:opacity-100 transition-opacity',
                  isTouchDevice && 'opacity-100',
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
