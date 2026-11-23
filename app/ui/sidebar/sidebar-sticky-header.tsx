import classNames from 'classnames';
import type { FC, PropsWithChildren } from 'react';

/**
 * Keeps its content on top of the sidebar while the list scrolls. It
 * covers the scroll area's top padding as well, so no row shows above it,
 * and the rows dissolve into it instead of meeting a hard edge. The fade
 * grows with the scroll (`scroll-fade-under`), so it is not there while
 * nothing is behind it.
 */
export const SidebarStickyHeader: FC<PropsWithChildren> = ({ children }) => (
  <div
    className={classNames(
      'sticky top-0 z-10 pb-1.5 bg-pca-white dark:bg-pca-grey-900',
      'before:absolute before:inset-x-0 before:bottom-full before:h-4',
      'before:bg-pca-white dark:before:bg-pca-grey-900',
      'after:pointer-events-none after:absolute after:inset-x-0',
      'after:top-full after:scroll-fade-under after:bg-linear-to-b',
      'after:from-pca-white after:to-pca-white/0',
      'dark:after:from-pca-grey-900 dark:after:to-pca-grey-900/0',
    )}
  >
    {children}
  </div>
);
