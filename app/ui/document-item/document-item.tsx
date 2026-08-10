import { Typography } from '../typography/typography';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';
import classNames from 'classnames';
import { useMedia } from 'react-use';
import { useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { REORDER_DURATION_MS } from './reorder-animation';

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
  const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)');
  const shouldReduceMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previousTopRef = useRef<number | null>(null);
  const reorderTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Measure the move before the browser paints the new order, then let CSS
  // animate it. A row that lost or gained a place glides over that distance,
  // while the row that came out on top only settles in — travelling the whole
  // list would drag the eye away from the document, the more so the longer
  // the list. The flags live on the element instead of in state so that
  // marking a move does not cost another render.
  useLayoutEffect(() => {
    const element = wrapperRef.current;
    const top = element?.offsetTop ?? null;
    const previousTop = previousTopRef.current;
    previousTopRef.current = top;

    if (
      shouldReduceMotion
      || !element
      || top === null
      || previousTop === null
      || top === previousTop
    ) {
      return;
    }

    if (top < previousTop) {
      element.dataset.reorder = 'settle';
    }
    else {
      element.dataset.reorder = 'shift';
      element.style.setProperty('--pca-row-shift', `${previousTop - top}px`);
    }

    clearTimeout(reorderTimeoutRef.current);
    reorderTimeoutRef.current = setTimeout(() => {
      delete element.dataset.reorder;
      element.style.removeProperty('--pca-row-shift');
    }, REORDER_DURATION_MS);
  });

  useEffect(() => () => clearTimeout(reorderTimeoutRef.current), []);

  const wrapperClasses = classNames([
    // Only colors transition — `transition-all` would fight the layout
    // animation for control over `transform`.
    'transition-colors group h-12 lg:h-10 flex items-center justify-between gap-2 pr-1 lg:pr-0.5 rounded-xl cursor-pointer',
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
    // Reordering — see the layout effect above.
    'data-[reorder=shift]:animate-row-shift',
    'data-[reorder=settle]:animate-row-settle',
    className,
  ]);

  const Component = as as React.ElementType;

  return (
    <div
      ref={wrapperRef}
      className={wrapperClasses}
    >
      <Component
        {...rest}
        ref={ref}
        className="flex items-center gap-2 min-w-0 flex-1 pl-3 h-12 lg:h-10 focus:outline-none"
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
          'shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 has-data-[state=open]:opacity-100 transition-opacity',
          'group-has-aria-[current=page]:[&_button:hover]:bg-pca-yellow-700',
          'dark:group-has-aria-[current=page]:[&_button:hover]:bg-pca-yellow-700',
          'group-has-aria-[current=page]:[&_button[data-state=open]]:bg-pca-yellow-700!',
          'dark:group-has-aria-[current=page]:[&_button[data-state=open]]:bg-pca-yellow-700!',
          'group-has-aria-[current=page]:[&_button:focus]:ring-pca-yellow-700',
          'dark:group-has-aria-[current=page]:[&_button:focus]:ring-pca-yellow-700',
          // Force dark text/icon on the yellow active surface in dark mode.
          'dark:group-has-aria-[current=page]:[&_button]:text-pca-grey-900!',
          isTouchDevice && 'opacity-100',
        ])}
        >
          {actionArea}
        </div>
      )}
    </div>
  );
};
