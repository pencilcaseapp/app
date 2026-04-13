import { Item } from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuItemProps as RadixDropdownMenuItemProps } from '@radix-ui/react-dropdown-menu';
import type { PropsWithChildren } from 'react';
import classNames from 'classnames';
import type { PolymorphicComponentProp } from '../polymorphic-types/polymorphic-types';
import { Typography } from '../typography/typography';
import { LoadingIndicator } from '../loading-indicator/loading-indicator';
import type { IconName } from '../icon/icons';
import { Icon } from '../icon/icon';

export type DropdownMenuItemProps = RadixDropdownMenuItemProps
  & PropsWithChildren & {
    color?: 'primary' | 'danger';
    className?: string;
    isLoading?: boolean;
    icon?: IconName;
  };

export const DropdownMenuItem = <C extends React.ElementType = 'a'>({
  as,
  children,
  className,
  isLoading,
  icon,
  color = 'primary',
  ...props
}: PolymorphicComponentProp<C, DropdownMenuItemProps>) => {
  const Component = as ?? 'a';
  const { disabled, onSelect, textValue, ...restProps } = props;

  const classes = classNames([
    'grow text-inherit!',
    isLoading && 'opacity-0 pointer-events-none',
  ]);

  return (
    <Item disabled={disabled} textValue={textValue} onSelect={onSelect} asChild>
      <Component
        className={classNames(
          'relative w-full inline-flex items-center rounded-[10px] transition-colors hover:bg-pca-grey-300/15! dark:hover:bg-pca-grey-800/80! focus:outline-hidden focus:bg-pca-grey-200/40 dark:focus:bg-pca-white/10 px-2.5 py-1.5 duration-150 group',
          color === 'primary'
          && 'text-pca-grey-900 dark:text-pca-white',
          color === 'danger'
          && 'text-pca-red-500',
          disabled && 'opacity-30 pointer-events-none',
          className,
        )}
        {...restProps}
      >
        {icon && (
          <Icon icon={icon} className={classNames('mr-2 shrink-0 w-5 h-5', isLoading && 'opacity-0')} />
        )}
        <Typography
          as="span"
          variant="bodySmall"
          className={classes}
          textAlign="left"
        >
          {children}
        </Typography>

        {isLoading && <LoadingIndicator className="w-full inset-0 absolute" />}
      </Component>
    </Item>
  );
};
