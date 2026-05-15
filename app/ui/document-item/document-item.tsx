import { Typography } from '../typography/typography';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';
import classNames from 'classnames';

export type DocumentItemProps<C extends React.ElementType>
  = PolymorphicComponentPropWithRef<
    C,
    {
      title: string;
      actionArea?: React.ReactNode;
    }
  >;

export function DocumentItem<C extends React.ElementType = 'a'>(
  { as = 'a' as C,
    title,
    actionArea,
    className,
    ref,
    ...rest }: DocumentItemProps<C>,
) {
  const wrapperClasses = classNames([
    'transition-colors group h-9 flex items-center justify-between gap-2 pr-0.5 rounded-xl cursor-pointer',
    // Hover / open state — covers the whole row including actionArea.
    // Scoped to non-active rows so the yellow active surface isn't overridden.
    'not-has-aria-[current=page]:hover:bg-pca-grey-100 dark:not-has-aria-[current=page]:hover:bg-pca-grey-800',
    'not-has-aria-[current=page]:has-data-[state=open]:bg-pca-grey-100 dark:not-has-aria-[current=page]:has-data-[state=open]:bg-pca-grey-800',
    // Keyboard focus / press on the inner link (non-active rows)
    'not-has-aria-[current=page]:has-[:focus-visible]:bg-pca-grey-200 dark:not-has-aria-[current=page]:has-[:focus-visible]:bg-pca-grey-800',
    'not-has-aria-[current=page]:has-[:active]:bg-pca-grey-200 dark:not-has-aria-[current=page]:has-[:active]:bg-pca-grey-800',
    // Active (current page) styles — driven by aria-current on the inner link
    'has-aria-[current=page]:bg-pca-yellow-500 dark:has-aria-[current=page]:bg-pca-yellow-500',
    'dark:has-aria-[current=page]:text-pca-grey-900',
    // Focus / press while active — stay on the yellow surface
    'has-[[aria-current=page]:focus-visible]:bg-pca-yellow-700 dark:has-[[aria-current=page]:focus-visible]:bg-pca-yellow-700',
    'has-[[aria-current=page]:active]:bg-pca-yellow-700 dark:has-[[aria-current=page]:active]:bg-pca-yellow-700',
    // Disabled
    'has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50',
    className,
  ]);

  const Component = as as React.ElementType;

  return (
    <div className={wrapperClasses}>
      <Component
        {...rest}
        ref={ref}
        className="flex items-center gap-2 min-w-0 flex-1 pl-3 py-1 focus:outline-none"
      >
        <Typography
          variant="bodySmall"
          as="span"
          className="block truncate min-w-0 flex-1 dark:group-has-aria-[current=page]:text-pca-grey-900!"
          title={title}
        >
          {title}
        </Typography>
      </Component>
      {actionArea && (
        <div className={classNames([
          'shrink-0 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 lg:has-data-[state=open]:opacity-100 transition-opacity',
          'group-has-aria-[current=page]:[&_button:hover]:bg-pca-yellow-700',
          'dark:group-has-aria-[current=page]:[&_button:hover]:bg-pca-yellow-700',
          'group-has-aria-[current=page]:[&_button[data-state=open]]:bg-pca-yellow-700!',
          'dark:group-has-aria-[current=page]:[&_button[data-state=open]]:bg-pca-yellow-700!',
          'group-has-aria-[current=page]:[&_button:focus]:ring-pca-yellow-700',
          'dark:group-has-aria-[current=page]:[&_button:focus]:ring-pca-yellow-700',
          // Force dark text/icon on the yellow active surface in dark mode.
          'dark:group-has-aria-[current=page]:[&_button]:text-pca-grey-900!',
        ])}
        >
          {actionArea}
        </div>
      )}
    </div>
  );
};
