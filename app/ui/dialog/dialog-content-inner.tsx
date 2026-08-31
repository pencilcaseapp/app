import type { FC, PropsWithChildren, ReactNode } from 'react';

export type DialogContentInnerProps = {
  topArea?: ReactNode;
  sideArea?: ReactNode;
  footerArea?: ReactNode;
} & PropsWithChildren;

/*
 * The content structure inside a `DialogContent` popup: the scrollable
 * content area with an optional topbar above, a side area next to it
 * and a footer pinned below. A `sideArea` splits everything below the
 * topbar into two columns, which keeps the footer inside the content
 * column instead of running under the navigation.
 */
export const DialogContentInner: FC<DialogContentInnerProps>
  = ({ children, topArea, sideArea, footerArea }) => {
    return (
      <>
        {topArea && (
          <div className="shrink-0">
            {topArea}
          </div>
        )}
        <div className="flex min-h-0 flex-1">
          {sideArea && (
            <div className="shrink-0 overflow-y-auto overscroll-contain p-4">
              {sideArea}
            </div>
          )}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {children}
            </div>
            {footerArea && (
              <div className="shrink-0 p-4">
                {footerArea}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };
