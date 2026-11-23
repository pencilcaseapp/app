import type { FC, PropsWithChildren, ReactNode } from 'react';
import { useRef } from 'react';
import { useScrollEdgeFade } from '~/hooks/use-scroll-edge-fade';

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
 * column instead of running under the navigation. The content dissolves
 * into the topbar and the footer while it scrolls behind them, like the
 * drawer's does, and keeps a focused field clear of the fade.
 */
export const DialogContentInner: FC<DialogContentInnerProps>
  = ({ children, topArea, sideArea, footerArea }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useScrollEdgeFade(contentRef, {
      top: topArea !== undefined,
      bottom: footerArea !== undefined,
    });

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
            <div
              ref={contentRef}
              className="scroll-edge-fade min-h-0 flex-1 scroll-pt-6 scroll-pb-8 overflow-y-auto overscroll-contain p-4"
            >
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
