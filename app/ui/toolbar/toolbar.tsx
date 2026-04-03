import classNames from 'classnames';
import type { PropsWithChildren } from 'react';

export type ToolbarProps = {
  isScrolling?: boolean;
} & PropsWithChildren;

export const Toolbar: React.FC<ToolbarProps> = ({
  isScrolling = false,
  children,
}) => {
  return (
    <div className={classNames('flex gap-2 items-center h-11 origin-center transition-all ring-pca-grey-200 bg-pca-white/85 dark:bg-pca-grey-900/80 rounded-2xl px-1.5 py-1.5 mx-1',
      isScrolling && 'lg:shadow-xs lg:ring-1 lg:dark:ring-pca-grey-800 lg:backdrop-blur-md',
    )}
    >
      {children}
    </div>
  );
};
