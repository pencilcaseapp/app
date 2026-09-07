import classNames from 'classnames';
import type { PriceBackground } from '../price/price';

/*
 * The surface of a pricing card without its size: the tilted yellow
 * upgrade card that keeps its colours in both themes, or the flat white
 * card that follows the page. Shared by `PricingTable` and `PlanCard`.
 */
export const pricingSurfaceClasses = (background: PriceBackground) => {
  const onYellow = background === 'yellow';

  return classNames([
    onYellow && [
      'bg-pca-yellow-500 border border-pca-grey-900',
      // `-rotate-1` sets `rotate`, which `transform-none` would not
      // reset, so reduced motion keeps the tilt and drops the hover.
      '-rotate-1 transition-transform duration-150 ease-out',
      'has-[button:hover]:rotate-0',
      'motion-reduce:transition-none',
      'motion-reduce:has-[button:hover]:-rotate-1',
    ],
    !onYellow && [
      'border border-pca-grey-200 bg-pca-white',
      'dark:border-pca-grey-700 dark:bg-pca-grey-900',
    ],
  ]);
};
