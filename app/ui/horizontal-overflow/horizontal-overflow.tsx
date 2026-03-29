import classNames from 'classnames';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { RefObject, FC, PropsWithChildren } from 'react';
import { useScroll } from 'react-use';

export type HorizontalOverflowProps = {
  className?: string;
} & PropsWithChildren;

export const HorizontalOverflow: FC<HorizontalOverflowProps> = ({
  children,
  className,
}) => {
  const scrollableElement = useRef<HTMLDivElement>(null);
  const { x } = useScroll(scrollableElement as RefObject<HTMLDivElement>);
  const [hasOverflowLeft, setHasOverflowLeft] = useState(false);
  const [hasOverflowRight, setHasOverflowRight] = useState(false);

  const classes = classNames(
    className,
    'relative overflow-clip after:content-[\'\'] after:absolute after:w-12 after:h-full after:bg-overflow-gradient-light dark:after:bg-overflow-gradient-dark after:top-0 after:-right-[1px] before:content-[\'\'] before:absolute before:w-12 before:h-full before:bg-overflow-gradient-light dark:before:bg-overflow-gradient-dark before:top-0 before:-left-[1px] before:z-10 before:rotate-180 before:transition before:duration-300 after:transition after:duration-300 before:pointer-events-none after:pointer-events-none',
    hasOverflowLeft ? 'before:opacity-100' : 'before:opacity-0',
    hasOverflowRight ? 'after:opacity-100' : 'after:opacity-0',
  );

  const handleOverflowCalculation = useEffectEvent(() => {
    const { current } = scrollableElement;
    if (!current) return;

    setHasOverflowLeft(x > 0);
    setHasOverflowRight(
      Math.ceil(x + current.clientWidth) < current.scrollWidth,
    );
  });

  useEffect(() => {
    const element = scrollableElement.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      handleOverflowCalculation();
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [x, scrollableElement]);

  useEffect(() => {
    const element = scrollableElement.current;
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let direction: 'horizontal' | 'vertical' | null = null;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      direction = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (direction === null) {
        const deltaX = Math.abs(e.touches[0].clientX - startX);
        const deltaY = Math.abs(e.touches[0].clientY - startY);
        if (deltaX > 5 || deltaY > 5) {
          direction = deltaX > deltaY
            ? 'horizontal'
            : 'vertical';
        }
      }

      if (direction === 'horizontal') {
        e.stopPropagation();
      }
    };

    element.addEventListener('touchstart', onTouchStart, {
      passive: true,
    });
    element.addEventListener('touchmove', onTouchMove, {
      passive: true,
    });

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <div className={classes}>
      <div
        ref={scrollableElement}
        className="relative overflow-x-auto scrollbar-none"
      >
        {children}
      </div>
    </div>
  );
};
