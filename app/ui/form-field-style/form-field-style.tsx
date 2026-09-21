import classNames from 'classnames';
import type { PolymorphicComponentProp } from '../polymorphic-types/polymorphic-types';

export type FormFieldStyleProps = {
  /**
   * React to focus and hover on a descendant rather than on the element
   * itself. Set it when the styled element is a box around the real control,
   * which cannot take focus of its own.
   */
  focusWithin?: boolean;
};

/* The two interaction sets are spelled out rather than composed, because
   Tailwind only sees the variants it can read in the source. */
const selfInteractionClasses = 'hover:border-pca-blue-700 dark:hover:border-transparent dark:hover:bg-pca-grey-800 focus:border-pca-blue-700 dark:focus:border-pca-grey-700 dark:active:border-pca-grey-700 focus:ring-2 dark:focus:ring-0 active:ring-2 dark:active:ring-0 ring-pca-blue-300 dark:focus:bg-pca-grey-800 dark:active:bg-pca-grey-800';

const withinInteractionClasses = 'hover:border-pca-blue-700 dark:hover:border-transparent dark:hover:bg-pca-grey-800 focus-within:border-pca-blue-700 dark:focus-within:border-pca-grey-700 focus-within:ring-2 dark:focus-within:ring-0 ring-pca-blue-300 dark:focus-within:bg-pca-grey-800';

const selfErrorClasses = 'dark:bg-pca-red-500/10 dark:hover:bg-pca-red-500/20 dark:focus:bg-pca-red-500/20 dark:active:bg-pca-red-500/20 border-pca-red-500 dark:border-pca-red-500! hover:border-pca-red-700 dark:hover:border-pca-red-700 focus:border-pca-red-700 dark:focus:border-pca-red-700 focus:ring-pca-red-300 active:ring-pca-red-300';

const withinErrorClasses = 'dark:bg-pca-red-500/10 dark:hover:bg-pca-red-500/20 dark:focus-within:bg-pca-red-500/20 border-pca-red-500 dark:border-pca-red-500! hover:border-pca-red-700 dark:hover:border-pca-red-700 focus-within:border-pca-red-700 dark:focus-within:border-pca-red-700 focus-within:ring-pca-red-300';

export const FormFieldStyle = <C extends React.ElementType = 'input'>
(props: PolymorphicComponentProp<C, FormFieldStyleProps>) => {
  const {
    as,
    className,
    focusWithin,
    'aria-invalid': ariaInvalid,
    ...rest
  } = props;
  const Component = as || 'input';

  const classes = classNames([
    // Base styles
    'bg-white dark:bg-pca-grey-800/60 border border-pca-grey-900 dark:border-transparent transition-[color,background-color,border-color,box-shadow] duration-300 ease-in-out rounded-xl outline-0 p-3 text-sm font-inter text-pca-grey-900 dark:text-white',
    // Focus and hover styles
    focusWithin ? withinInteractionClasses : selfInteractionClasses,
    // Placeholder styles
    'placeholder-pca-grey-400 dark:placeholder-pca-grey-500 placeholder-sm placeholder-font-inter',
    // Disabled state styles
    'disabled:pointer-events-none disabled:bg-pca-grey-100 dark:disabled:bg-pca-grey-800/30 disabled:border-pca-grey-200 dark:disabled:border-transparent disabled:placeholder-pca-grey-300 dark:disabled:placeholder-pca-grey-800 disabled:text-pca-grey-400 dark:disabled:text-pca-grey-600',
    // Error state styles
    ariaInvalid && (focusWithin ? withinErrorClasses : selfErrorClasses),
    className,
  ]);

  return (
    <Component
      {...rest}
      aria-invalid={ariaInvalid}
      className={classes}
    />
  );
};
