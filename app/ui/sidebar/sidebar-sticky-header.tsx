import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { SCROLL_FADE_TOP, scrollFadeSize } from '~/utils/scroll-fade';

/**
 * Keeps its content on top of the sidebar while the list scrolls. It
 * covers the scroll area's top padding as well, so no row shows above it,
 * and the rows dissolve into it instead of meeting a hard edge. The fade
 * grows with the scroll, so it is not there while nothing is behind it.
 *
 * It sizes the fade like `useScrollEdgeFade` but draws it itself: that
 * hook masks the edge of the scroll container, and the header scrolls
 * inside it, so the mask would dissolve the header along with the rows.
 */
export const SidebarStickyHeader: FC<PropsWithChildren> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = ref.current;
    let scroller = header?.parentElement;

    while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }

    if (!header || !scroller) {
      return;
    }

    const container = scroller;
    const update = () => header.style.setProperty(
      '--fade-under',
      scrollFadeSize(container.scrollTop, SCROLL_FADE_TOP),
    );

    update();
    container.addEventListener('scroll', update, { passive: true });

    return () => container.removeEventListener('scroll', update);
  }, []);

  return (
    <div
      ref={ref}
      className={classNames(
        'sticky top-0 z-10 pb-1.5 bg-pca-white dark:bg-pca-grey-900',
        'before:absolute before:inset-x-0 before:bottom-full before:h-4',
        'before:bg-pca-white dark:before:bg-pca-grey-900',
        'after:pointer-events-none after:absolute after:inset-x-0',
        'after:top-full after:h-(--fade-under,0px) after:bg-linear-to-b',
        'after:from-pca-white after:to-pca-white/0',
        'dark:after:from-pca-grey-900 dark:after:to-pca-grey-900/0',
      )}
    >
      {children}
    </div>
  );
};
