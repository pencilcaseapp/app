import { Typography } from '../typography/typography';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';
import classNames from 'classnames';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';
import { Tooltip } from '../tooltip/tooltip';

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
    iconOnly = false,
    ref,
    ...rest }: DocumentItemProps<C>,
) {
  const wrapperClasses = classNames([
    'transition-colors group h-9 flex items-center justify-between gap-2 pl-2 pr-0.5 rounded-xl cursor-pointer',
    'has-aria-[current=page]:bg-pca-grey-200 dark:has-aria-[current=page]:bg-pca-grey-800',
    'hover:bg-pca-grey-100 dark:hover:bg-pca-grey-800',
    'has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50',
    iconOnly && 'w-10 pr-2',
    className,
  ]);

  const Component = as as React.ElementType;

  return (
    <>
      {iconOnly
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
                  className="block truncate min-w-0 flex-1"
                  title={title}
                >
                  {title}
                </Typography>
              </Component>
              {actionArea && (
                <div className={classNames([
                  'shrink-0 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 lg:has-data-[state=open]:opacity-100 transition-opacity',
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
