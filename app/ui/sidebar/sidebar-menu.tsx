import { useState, type FC } from 'react';

import { motion } from 'motion/react';
import classNames from 'classnames';
import { useSidebarContext } from '../sidebar-context/use-sidebar-context';
import { IconOnlyContext } from '../navigation-item/icon-only-context';
import {
  slimNavigation,
  toggleNavigation,
} from './framer-animation';
import { StickyBottomArea } from './sticky-bottom-area';
import type { SidebarBaseProps } from './types';

export type SidebarMenuProps = {
  initialState?: 'open' | 'close';
} & SidebarBaseProps;

export const SidebarMenu: FC<SidebarMenuProps> = ({
  bottomArea,
  initialState,
  items,
  showSlimSidebar = false,
}) => {
  const { isSidebarOpen } = useSidebarContext();
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  return (
    <>
      <motion.div
        variants={toggleNavigation}
        animate={isSidebarOpen ? 'open' : 'close'}
        onAnimationComplete={() => setIsAnimationComplete(true)}
        onAnimationStart={() => setIsAnimationComplete(false)}
        exit="close"
        initial={initialState ?? (isSidebarOpen ? 'open' : 'close')}
        className={classNames([
          'fixed flex max-w-none sm:max-w-62.5 pointer-events-auto overscroll-y-contain z-20 overflow-hidden w-full pt-14 h-dvh bg-pca-white dark:bg-pca-grey-900',
          isAnimationComplete && 'transition-shadow ease-in-out duration-200 sm:max-xl:shadow-md sm:max-xl:ring-1 ring-pca-grey-200 sm:max-xl:dark:ring-pca-grey-800',
        ])}
      >
        <nav className="top-0 left-0 h-[100dvh-56px] flex justify-between flex-col w-full max-w-none sm:max-w-62.5 overflow-hidden overscroll-y-none overflow-x-hidden">
          <ul className="flex gap-2 flex-col px-1.5 pt-4 grow overflow-scroll scrollbar-none pb-42">
            {items.map(({ key, content }) => {
              return <li key={key}>{content}</li>;
            })}
          </ul>
          {bottomArea && (
            <StickyBottomArea>
              {bottomArea}
            </StickyBottomArea>
          )}
        </nav>
      </motion.div>
      {showSlimSidebar && (
        <motion.div
          variants={slimNavigation}
          animate={isSidebarOpen ? 'open' : 'close'}
          initial={false}
          className="fixed top-0 left-0 flex flex-col pointer-events-auto z-10 pt-14 h-screen w-16"
        >
          <IconOnlyContext value={true}>
            <nav className=" relative flex flex-col grow">
              {bottomArea && (
                <StickyBottomArea>
                  {bottomArea}
                </StickyBottomArea>
              )}
            </nav>
          </IconOnlyContext>
        </motion.div>
      )}
    </>
  );
};
