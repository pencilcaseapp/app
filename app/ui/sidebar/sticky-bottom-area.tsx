import { type FC, type PropsWithChildren } from 'react';

export const StickyBottomArea: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <div className="absolute w-full bottom-0 left-0 flex gap-1.5 flex-col glass-surface border-white dark:border-pca-grey-900 border px-1.5 pb-3 pt-1.5 z-10 rounded-t-xl">
        {children}
      </div>
    </>
  );
};
