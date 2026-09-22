import { Content } from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuContentProps as RadixDropdownMenuContentProps } from '@radix-ui/react-dropdown-menu';
import classNames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import type { DropdownMenuVariant } from './dropdown-menu-variant-context';
import { DropdownMenuVariantContext } from './dropdown-menu-variant-context';
import { menuShellClasses, menuSurfaceClasses } from '../menu-surface/menu-surface';

export type DropdownMenuContentProps = RadixDropdownMenuContentProps
  & PropsWithChildren & {
    variant?: DropdownMenuVariant;
  };

export const DropdownMenuContent: FC<DropdownMenuContentProps> = ({
  children,
  className,
  variant = 'glass',
  ...radixDropdownMenuContentProps
}) => {
  return (
    <Content
      hideWhenDetached={true}
      className={classNames(
        menuShellClasses,
        'data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out data-[align=start]:origin-top-left data-[align=end]:origin-top-right data-[align=center]:origin-top z-50',
        menuSurfaceClasses[variant],
        // Safari drops the backdrop blur on the first frame of the fade, so
        // the frosted surface leaves for the colour it resolves to. The solid
        // one has no backdrop filter to lose.
        variant === 'glass' && 'data-[state=closed]:glass-surface-opaque',
        className,
      )}
      sideOffset={4}
      {...radixDropdownMenuContentProps}
    >
      <DropdownMenuVariantContext value={variant}>
        {children}
      </DropdownMenuVariantContext>
    </Content>
  );
};
