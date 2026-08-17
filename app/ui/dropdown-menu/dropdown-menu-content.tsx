import { Content } from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuContentProps as RadixDropdownMenuContentProps } from '@radix-ui/react-dropdown-menu';
import classNames from 'classnames';
import type { FC, PropsWithChildren } from 'react';

export type DropdownMenuContentProps = RadixDropdownMenuContentProps
  & PropsWithChildren;

export const DropdownMenuContent: FC<DropdownMenuContentProps> = ({
  children,
  className,
  ...radixDropdownMenuContentProps
}) => {
  return (
    <Content
      hideWhenDetached={true}
      className={classNames('flex flex-col min-w-64 p-1.5 gap-0.5 data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out data-[state=closed]:glass-surface-opaque data-[align=start]:origin-top-left data-[align=end]:origin-top-right data-[align=center]:origin-top z-50 rounded-2xl glass-surface shadow-glass dark:shadow-glass-dark glass-border', className)}
      alignOffset={10}
      sideOffset={4}
      {...radixDropdownMenuContentProps}
    >
      {children}
    </Content>
  );
};
