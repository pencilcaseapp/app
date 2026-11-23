import classNames from 'classnames';
import { type FC, type PropsWithChildren } from 'react';

export type StickyBottomAreaProps = PropsWithChildren & {
  /**
   * The full sidebar's bottom area is solid, with the list fading into it,
   * so no row shows behind it. The slim sidebar has no list to cover and
   * keeps the glass.
   */
  solid?: boolean;
};

export const StickyBottomArea: FC<StickyBottomAreaProps> = ({
  children,
  solid = false,
}) => {
  return (
    <div
      className={classNames(
        'absolute w-full bottom-0 left-0 flex gap-1.5 flex-col px-1.5 pb-3 pt-1.5 z-10',
        solid
          ? [
              'bg-pca-white dark:bg-pca-grey-900',
              'before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-6',
              'before:bg-linear-to-t before:from-pca-white before:to-pca-white/0',
              'dark:before:from-pca-grey-900 dark:before:to-pca-grey-900/0',
            ]
          : 'glass-surface border-white dark:border-pca-grey-900 border rounded-t-xl',
      )}
    >
      {children}
    </div>
  );
};
