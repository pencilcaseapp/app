import classNames from 'classnames';
import type { PolymorphicComponentProp } from '../polymorphic-types/polymorphic-types';

export const FormFieldStyle = <C extends React.ElementType = 'input'>
(props: PolymorphicComponentProp<C, unknown>) => {
  const { as, className, 'aria-invalid': ariaInvalid, ...rest } = props;
  const Component = as || 'input';

  const classes = classNames([
    // Base styles
    'bg-white dark:bg-pca-grey-800/60 border border-pca-grey-900 dark:border-transparent transition-all duration-300 ease-in-out rounded-xl outline-0 p-3 text-sm font-inter text-pca-grey-900 dark:text-white',
    // Focus and hover styles
    'hover:border-pca-blue-700 dark:hover:border-transparent dark:hover:bg-pca-grey-800 focus:border-pca-blue-700 dark:focus:border-pca-grey-700 dark:active:border-pca-grey-700 focus:ring-2 dark:focus:ring-0 active:ring-2 dark:active:ring-0 ring-pca-blue-300 dark:focus:bg-pca-grey-800 dark:active:bg-pca-grey-800',
    // Placeholder styles
    'placeholder-pca-grey-400 dark:placeholder-pca-grey-500 placeholder-sm placeholder-font-inter',
    // Disabled state styles
    'disabled:pointer-events-none disabled:bg-pca-grey-100 dark:disabled:bg-pca-grey-800/30 disabled:border-pca-grey-200 dark:disabled:border-transparent disabled:placeholder-pca-grey-300 dark:disabled:placeholder-pca-grey-800',
    // Error state styles
    ariaInvalid && 'dark:bg-pca-red-500/10 dark:hover:bg-pca-red-500/20 dark:focus:bg-pca-red-500/20 dark:active:bg-pca-red-500/20 border-pca-red-500 dark:border-pca-red-500! hover:border-pca-red-700 dark:hover:border-pca-red-700 focus:border-pca-red-700 dark:focus:border-pca-red-700 focus:ring-pca-red-300 active:ring-pca-red-300',
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
