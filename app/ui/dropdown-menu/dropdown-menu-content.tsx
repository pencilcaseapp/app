import { Content } from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuContentProps as RadixDropdownMenuContentProps } from '@radix-ui/react-dropdown-menu';
import classNames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import type { DropdownMenuVariant } from './dropdown-menu-variant-context';
import { DropdownMenuVariantContext } from './dropdown-menu-variant-context';

export type DropdownMenuContentProps = RadixDropdownMenuContentProps
  & PropsWithChildren & {
    variant?: DropdownMenuVariant;
  };

/* The glass surface fades out through `glass-surface-opaque` because Safari
   drops the backdrop blur on the first frame of the fade; the solid one has no
   backdrop filter to lose, so it keeps its own background throughout. */
const variantClasses: Record<DropdownMenuVariant, string> = {
  glass: 'glass-surface glass-border data-[state=closed]:glass-surface-opaque',
  solid: 'bg-pca-white dark:bg-pca-grey-800 border border-pca-grey-200 dark:border-pca-grey-700',
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
      className={classNames('flex flex-col min-w-64 p-1.5 gap-0.5 data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out data-[align=start]:origin-top-left data-[align=end]:origin-top-right data-[align=center]:origin-top z-50 rounded-2xl shadow-glass dark:shadow-glass-dark', variantClasses[variant], className)}
      alignOffset={10}
      sideOffset={4}
      {...radixDropdownMenuContentProps}
    >
      <DropdownMenuVariantContext value={variant}>
        {children}
      </DropdownMenuVariantContext>
    </Content>
  );
};
