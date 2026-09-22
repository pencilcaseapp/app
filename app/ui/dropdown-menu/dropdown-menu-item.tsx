import { Item } from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuItemProps as RadixDropdownMenuItemProps } from '@radix-ui/react-dropdown-menu';
import type { PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';
import type { PolymorphicComponentProp } from '../polymorphic-types/polymorphic-types';
import { Typography } from '../typography/typography';
import { LoadingIndicator } from '../loading-indicator/loading-indicator';
import type { IconName } from '../icon/icons';
import { Icon } from '../icon/icon';
import type { DropdownMenuVariant } from './dropdown-menu-variant-context';
import { useDropdownMenuVariant } from './dropdown-menu-variant-context';
import { menuItemClasses } from '../menu-surface/menu-surface';

export type DropdownMenuItemProps = RadixDropdownMenuItemProps
  & PropsWithChildren & {
    color?: 'primary' | 'danger';
    className?: string;
    isLoading?: boolean;
    icon?: IconName;
    /**
     * Content pinned to the right hand side of the item — a check mark, a
     * shortcut, a count. The label keeps the space it does not use.
     */
    trailing?: ReactNode;
  };

const variantClasses: Record<DropdownMenuVariant, string> = {
  glass: 'hover:bg-pca-grey-300/15! dark:hover:bg-pca-grey-800/80! focus:bg-pca-grey-200/40 dark:focus:bg-pca-white/10',
  solid: 'hover:bg-pca-grey-200! dark:hover:bg-pca-grey-700! focus:bg-pca-grey-200 dark:focus:bg-pca-grey-700',
};

export const DropdownMenuItem = <C extends React.ElementType = 'a'>({
  as,
  children,
  className,
  isLoading,
  icon,
  trailing,
  color = 'primary',
  ...props
}: PolymorphicComponentProp<C, DropdownMenuItemProps>) => {
  const Component = as ?? 'a';
  const variant = useDropdownMenuVariant();
  const { disabled, onSelect, textValue, ...restProps } = props;

  const classes = classNames([
    'grow text-inherit!',
    isLoading && 'opacity-0 pointer-events-none',
  ]);

  return (
    <Item disabled={disabled} textValue={textValue} onSelect={onSelect} asChild>
      <Component
        className={classNames(
          menuItemClasses,
          variantClasses[variant],
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
          as="div"
          variant="bodySmall"
          className={classes}
          textAlign="left"
        >
          {children}
        </Typography>

        {trailing && (
          <div className={classNames('ml-2 shrink-0', isLoading && 'opacity-0')}>
            {trailing}
          </div>
        )}

        {isLoading && <LoadingIndicator className="w-full inset-0 absolute" />}
      </Component>
    </Item>
  );
};
