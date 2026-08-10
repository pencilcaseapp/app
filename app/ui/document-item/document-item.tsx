import { Typography } from '../typography/typography';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';
import classNames from 'classnames';
import { useMedia } from 'react-use';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { REORDER_DURATION_MS, reorderItem } from './framer-animation';

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
  const movingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Flag which way the row is about to travel, measured before the browser
  // paints the new order. `offsetTop` ignores the transform the layout
  // animation puts on the row, so it always reports the new slot. The flag
  // lives on the element instead of in state so that marking it does not cost
  // another render right when the animation starts.
  useLayoutEffect(() => {
    const element = wrapperRef.current;
    const top = element?.offsetTop ?? null;
    const previousTop = previousTopRef.current;
    previousTopRef.current = top;

    if (shouldReduceMotion || !element || top === null) {
      return;
    }

    if (previousTop !== null && top !== previousTop) {
      element.dataset.moving = top < previousTop ? 'up' : 'down';

      clearTimeout(movingTimeoutRef.current);
      movingTimeoutRef.current = setTimeout(() => {
        delete element.dataset.moving;
      }, REORDER_DURATION_MS);
    }
  });

  useEffect(() => () => clearTimeout(movingTimeoutRef.current), []);

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
    // A travelling row needs an opaque surface of its own, otherwise the
    // titles it passes show through it. Active rows already have one.
    'not-has-aria-[current=page]:data-[moving]:bg-pca-white',
    'dark:not-has-aria-[current=page]:data-[moving]:bg-pca-grey-900',
    // Only the row moving up is positioned, which paints it above the rows
    // making room for it — so it reads as one item rising to the top.
    'data-[moving=up]:relative',
    className,
  ]);

  const Component = as as React.ElementType;

  return (
    <motion.div
      ref={wrapperRef}
      layout={shouldReduceMotion ? false : 'position'}
      transition={{ layout: reorderItem }}
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
    </motion.div>
  );
};
