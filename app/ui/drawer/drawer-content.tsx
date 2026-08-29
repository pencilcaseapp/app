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

// While a nested drawer stacks on top, the areas of the drawer behind
// fade out (and back in while the nested drawer is swiped).
const nestedFadeClassName = 'group-data-nested-drawer-open/popup:opacity-0 group-data-nested-drawer-swiping/popup:opacity-100';

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
  /** CSS length the drawer may grow to, e.g. `calc(100dvh - 4.5rem)`. */
  maxHeight?: string;
  /** CSS length the drawer keeps even when its content is shorter. */
  minHeight?: string;
  /** Replaces the default padding of the scrollable content area. */
  contentClassName?: string;
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
    maxHeight = '95dvh',
    minHeight = '0px',
    contentClassName = 'px-4 pt-4 pb-6',
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
                  `calc(${reservedFooterHeight}px`
                  + ' + env(safe-area-inset-bottom, 0px) + var(--bleed))',
                '--drawer-max-height': maxHeight,
                '--drawer-min-height': minHeight,
              } as CSSProperties}
              className={classNames(
                'group/popup relative z-1 -mb-(--bleed) flex w-full flex-col overflow-visible border-t rounded-t-3xl border-white bg-white outline-none touch-none shadow-[0.25rem_0.25rem_0] shadow-black/12 [--bleed:3rem] h-[var(--drawer-height,auto)] origin-[50%_calc(100%-var(--bleed))] transform-[translateY(calc(var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--shrink)*var(--stack-height))))_scale(var(--scale))] transition-[transform,height,box-shadow] duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform data-swiping:select-none data-swiping:duration-0 data-nested-drawer-swiping:duration-0 data-ending-style:transform-[translateY(calc(100%-var(--bleed)+2px))] data-starting-style:transform-[translateY(calc(100%-var(--bleed)+2px))] data-starting-style:shadow-[0.25rem_0.25rem_0] data-starting-style:shadow-black/0 data-ending-style:shadow-[0.25rem_0.25rem_0] data-ending-style:shadow-black/0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] dark:border-pca-grey-800 dark:bg-pca-grey-900 dark:shadow-none',
                // Stacking of nested drawers: a drawer behind the frontmost
                // one is scaled down and lifted so it peeks out above it,
                // following the Base UI nested drawers recipe.
                '[--peek:1rem] [--stack-step:0.05] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--scale-base:calc(max(0,1-(var(--nested-drawers)*var(--stack-step))))] [--scale:clamp(0,calc(var(--scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--shrink:calc(1-var(--scale))] [--stack-height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))]',
                // z-20 keeps the dimming above sticky elements inside
                // the scroll area, which carry their own z-index.
                'after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:bg-transparent after:content-[\'\'] after:transition-[background-color] after:duration-450 after:ease-[cubic-bezier(0.32,0.72,0,1)]',
                'data-nested-drawer-open:h-[calc(var(--stack-height)+var(--bleed))] data-nested-drawer-open:overflow-hidden data-nested-drawer-open:after:bg-black/5',
                'max-h-[calc(var(--drawer-max-height)+var(--bleed))]',
                isFullHeight
                  ? 'min-h-[calc(var(--drawer-max-height)+var(--bleed))]'
                  : 'min-h-[calc(var(--drawer-min-height)+var(--bleed))]',
                'data-nested-drawer-open:min-h-0',
                footerArea === undefined && 'pb-[calc(env(safe-area-inset-bottom,0px)+var(--bleed))]',
              )}
            >
              {/* While a nested drawer pins the popup to the stack
                  height, this wrapper keeps the drawer's own height so
                  the layout does not reflow into the smaller popup —
                  the popup clips it instead. */}
              <div className="flex min-h-0 grow flex-col group-data-nested-drawer-open/popup:h-(--drawer-height) group-data-nested-drawer-open/popup:grow-0 group-data-nested-drawer-open/popup:shrink-0">
                <div className={classNames('w-12 h-1.5 bg-pca-grey-200 shrink-0 rounded-full dark:bg-pca-grey-800 mx-auto mb-4 mt-4 transition-opacity duration-300', nestedFadeClassName)} />
                {topArea && (
                  <div className={classNames('px-4 border-b border-pca-grey-200 dark:border-pca-grey-800 transition-opacity duration-300', nestedFadeClassName)}>
                    {topArea}
                  </div>
                )}
                <Drawer.Content {...drawerContentProps} className={classNames('min-h-0 flex-1 overflow-y-auto overscroll-contain touch-auto transition-opacity duration-300', contentClassName, nestedFadeClassName)}>
                  {children}
                </Drawer.Content>
                {footerArea && (
                  <div className={classNames('relative min-h-(--footer-reserved-height) shrink-0 transition-[min-height,opacity] duration-260 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:min-h-[calc(var(--footer-reserved-height)+var(--drawer-keyboard-inset,0px))] motion-reduce:transition-none', nestedFadeClassName)}>
                    <div className="absolute right-0 bottom-0 left-0 z-1 border-t border-pca-grey-200 dark:border-pca-grey-800 bg-white px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px)+var(--bleed))] transition-[bottom,padding-bottom] duration-260 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[bottom,padding-bottom] focus-within:fixed focus-within:z-3 focus-within:bottom-0 focus-within:pb-[calc(0.625rem+env(safe-area-inset-bottom,0px)+var(--bleed)+var(--drawer-keyboard-inset,0px))] focus-within:transform-[translate3d(0,0,0)] motion-reduce:transition-none  dark:bg-pca-grey-900">
                      {footerArea}
                    </div>
                  </div>
                )}
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    );
  };
