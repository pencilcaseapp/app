import { Drawer } from '@base-ui/react/drawer';
import type {
  DrawerContentProps as BaseDrawerContentProps,
} from '@base-ui/react';
import type { CSSProperties, FC, PropsWithChildren, ReactNode } from 'react';
import { useRef } from 'react';
import classNames from 'classnames';
import { useScrollEdgeFade } from '~/hooks/use-scroll-edge-fade';
import { nestedFadeClassName } from './drawer-content';

export type DrawerContentInnerProps = {
  drawerContentProps?: BaseDrawerContentProps;
  topArea?: ReactNode;
  footerArea?: ReactNode;
  reservedFooterHeight?: number;
  /** Replaces the default padding of the scrollable content area. */
  contentClassName?: string;
  /** Horizontal padding of the topbar and the footer area. */
  gutterClassName?: string;
} & PropsWithChildren;

/*
 * The content structure inside a `DrawerContent` popup: the scrollable
 * content area with an optional topbar above and a footer pinned below.
 * Without a footer it pads the bottom itself, so the content clears the
 * popup's off-screen bleed.
 *
 * The content dissolves into the topbar and the footer rather than
 * meeting a line drawn between them, and only on a side that has both
 * something to scroll and something to scroll behind.
 */
export const DrawerContentInner: FC<DrawerContentInnerProps>
  = ({
    children,
    drawerContentProps,
    topArea,
    footerArea,
    reservedFooterHeight = 56,
    gutterClassName = 'px-5',
    contentClassName = `${gutterClassName} pt-4 pb-6`,
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useScrollEdgeFade(contentRef, {
      top: topArea !== undefined,
      bottom: footerArea !== undefined,
    });

    return (
      <div
        className={classNames(
          'flex min-h-0 grow flex-col',
          footerArea === undefined
          && 'pb-[calc(var(--safe-area-bottom)+var(--bleed))]',
        )}
      >
        {topArea && (
          <div className={classNames(gutterClassName, 'transition-opacity duration-300', nestedFadeClassName)}>
            {topArea}
          </div>
        )}
        <Drawer.Content {...drawerContentProps} ref={contentRef} className={classNames('scroll-edge-fade min-h-0 flex-1 overflow-y-auto overscroll-contain touch-auto transition-opacity duration-300', contentClassName, nestedFadeClassName)}>
          {children}
        </Drawer.Content>
        {footerArea && (
          <div
            // A class built from the prop would never be seen by
            // Tailwind's scanner, so the variable is set inline.
            style={{
              '--footer-reserved-height':
                `calc(${reservedFooterHeight}px`
                + ' + var(--safe-area-bottom) + var(--bleed))',
            } as CSSProperties}
            className={classNames('relative min-h-(--footer-reserved-height) shrink-0 transition-[min-height,opacity] duration-260 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:min-h-[calc(var(--footer-reserved-height)+var(--drawer-keyboard-inset,0px))] motion-reduce:transition-none', nestedFadeClassName)}
          >
            {/* The keyboard covers the bottom edge of the screen while it
                is up, so the footer above it drops the safe area again. */}
            <div className={classNames(gutterClassName, 'absolute right-0 bottom-0 left-0 z-1 bg-white pt-2.5 pb-[calc(0.625rem+var(--safe-area-bottom)+var(--bleed))] transition-[bottom,padding-bottom] duration-260 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[bottom,padding-bottom] focus-within:fixed focus-within:z-3 focus-within:bottom-0 focus-within:pb-[calc(0.625rem+env(safe-area-inset-bottom,0px)+var(--bleed)+var(--drawer-keyboard-inset,0px))] focus-within:transform-[translate3d(0,0,0)] motion-reduce:transition-none  dark:bg-pca-grey-900')}>
              {footerArea}
            </div>
          </div>
        )}
      </div>
    );
  };
