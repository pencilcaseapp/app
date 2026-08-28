import { Drawer } from '@base-ui/react/drawer';
import type {
  DrawerPortalProps,
  DrawerBackdropProps,
  DialogViewportProps,
  DrawerPopupProps,
  DrawerContentProps as BaseDrawerContentProps,
} from '@base-ui/react';
import type { CSSProperties, FC, PropsWithChildren } from 'react';
import classNames from 'classnames';

export type DrawerContentProps = {
  drawerPortalProps?: DrawerPortalProps;
  drawerBackdropProps?: DrawerBackdropProps;
  dialogViewportProps?: DialogViewportProps;
  drawerPopupProps?: DrawerPopupProps;
  drawerContentProps?: BaseDrawerContentProps;
  topArea?: React.ReactNode;
  footerArea?: React.ReactNode;
  reservedFooterHeight?: number;
  isFullHeight?: boolean;
} & PropsWithChildren;

export const DrawerContent: FC<DrawerContentProps>
  = ({
    children,
    drawerPortalProps,
    drawerBackdropProps,
    dialogViewportProps,
    drawerPopupProps,
    drawerContentProps,
    topArea,
    footerArea,
    isFullHeight = false,
    reservedFooterHeight = 56,
  }) => {
    return (
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal {...drawerPortalProps}>
          <Drawer.Backdrop {...drawerBackdropProps} className="[--backdrop-opacity:0.2] [--bleed:3rem] fixed inset-0 min-h-dvh bg-pca-grey-700 opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] dark:[--backdrop-opacity:0.7] data-starting-style:opacity-0 data-ending-style:opacity-0 data-swiping:duration-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]" />
          <Drawer.Viewport {...dialogViewportProps} className="fixed inset-0 flex items-end justify-center touch-none [--bleed:3rem] after:pointer-events-none after:fixed after:inset-x-0 after:bottom-0 after:h-(--bleed) after:bg-white after:content-[''] data-closed:after:opacity-0 has-data-swiping:after:opacity-0 dark:after:bg-pca-grey-900">
            <Drawer.Popup
              {...drawerPopupProps}
              // A class built from the prop would never be seen by
              // Tailwind's scanner, so the variable is set inline.
              style={{
                '--footer-reserved-height':
                  `calc(${reservedFooterHeight}px + var(--bleed))`,
              } as CSSProperties}
              className={classNames(
                'relative z-1 -mb-(--bleed) flex w-full flex-col overflow-visible border-t rounded-t-3xl border-white bg-white outline-none touch-none shadow-[0.25rem_0.25rem_0] shadow-black/12 [--bleed:3rem] transform-[translateY(var(--drawer-swipe-movement-y))] transition-[transform,box-shadow] duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform data-swiping:select-none data-ending-style:transform-[translateY(calc(100%-var(--bleed)+2px))] data-starting-style:transform-[translateY(calc(100%-var(--bleed)+2px))] data-starting-style:shadow-[0.25rem_0.25rem_0] data-starting-style:shadow-black/0 data-ending-style:shadow-[0.25rem_0.25rem_0] data-ending-style:shadow-black/0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] dark:border-pca-grey-800 dark:bg-pca-grey-900 dark:shadow-none',
                'max-h-[calc(95dvh+var(--bleed))]',
                isFullHeight && 'min-h-[calc(95dvh+var(--bleed))]',
                footerArea === undefined && 'pb-[calc(env(safe-area-inset-bottom,0px)+var(--bleed))]',
              )}
            >
              <div className="w-12 h-1.5 bg-pca-grey-200 shrink-0 rounded-full dark:bg-pca-grey-800 mx-auto mb-4 mt-4" />
              {topArea && (
                <div className="px-4 border-b border-pca-grey-200 dark:border-pca-grey-800">
                  {topArea}
                </div>
              )}
              <Drawer.Content {...drawerContentProps} className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-auto px-4 pt-4 pb-6">
                {children}
              </Drawer.Content>
              {footerArea && (
                <div className="relative min-h-(--footer-reserved-height) shrink-0 transition-[min-height] duration-260 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:min-h-[calc(var(--footer-reserved-height)+var(--drawer-keyboard-inset,0px))] motion-reduce:transition-none">
                  <div className="absolute right-0 bottom-0 left-0 z-1 border-t border-pca-grey-200 dark:border-pca-grey-800 bg-white px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px)+var(--bleed))] transition-[bottom,padding-bottom] duration-260 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[bottom,padding-bottom] focus-within:fixed focus-within:z-3 focus-within:bottom-0 focus-within:pb-[calc(0.625rem+env(safe-area-inset-bottom,0px)+var(--bleed)+var(--drawer-keyboard-inset,0px))] focus-within:transform-[translate3d(0,0,0)] motion-reduce:transition-none  dark:bg-pca-grey-900">
                    {footerArea}
                  </div>
                </div>
              )}
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    );
  };
