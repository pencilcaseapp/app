import classNames from 'classnames';
import type { ComponentPropsWithoutRef, Ref } from 'react';
import { Icon } from '../icon/icon';

export type ChoiceTriggerProps = ComponentPropsWithoutRef<'button'> & {
  ref?: Ref<HTMLButtonElement>;
};

/**
 * The compact label and caret that opens a chooser: a value in a row, a role
 * beside a person. It is only the trigger, so it can be handed to whichever
 * chooser the choice calls for — `Select` renders it through Base UI's
 * `render`, a `DropdownMenu` through Radix's `asChild` — and the two look the
 * same because they are the same button.
 */
export const ChoiceTrigger = ({
  children,
  className,
  ref,
  type = 'button',
  ...props
}: ChoiceTriggerProps) => {
  return (
    <button
      ref={ref}
      type={type}
      className={classNames(
        'inline-flex h-8 max-w-full shrink-0 cursor-pointer items-center gap-1 rounded-lg pl-2.5 pr-1.5 text-sm font-medium text-pca-grey-700 outline-0 transition-colors duration-150 dark:text-pca-grey-300',
        'hover:bg-pca-grey-200 dark:hover:bg-pca-grey-800',
        'data-popup-open:bg-pca-grey-200 dark:data-popup-open:bg-pca-grey-800',
        'data-[state=open]:bg-pca-grey-200 dark:data-[state=open]:bg-pca-grey-800',
        'focus-visible:ring-2 ring-pca-blue-300',
        'data-disabled:pointer-events-none data-disabled:opacity-30 disabled:pointer-events-none disabled:opacity-30',
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      <Icon icon="chevronDown" className="h-4 w-4 shrink-0" />
    </button>
  );
};
