import classNames from 'classnames';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { RefObject, FC, PropsWithChildren } from 'react';
import { useScroll } from 'react-use';

export type HorizontalOverflowProps = PropsWithChildren;

export const HorizontalOverflow: FC<HorizontalOverflowProps> = ({
  children,
}) => {
  const scrollableElement = useRef<HTMLDivElement>(null);
  const { x } = useScroll(scrollableElement as RefObject<HTMLDivElement>);
  const [hasOverflowLeft, setHasOverflowLeft] = useState(false);
  const [hasOverflowRight, setHasOverflowRight] = useState(false);

  const classes = classNames(
    'relative overflow-hidden after:content-[\'\'] after:absolute after:w-12 after:h-full after:bg-overflow-gradient-light dark:after:bg-overflow-gradient-dark after:top-0 after:-right-[1px] before:content-[\'\'] before:absolute before:w-12 before:h-full before:bg-overflow-gradient-light dark:before:bg-overflow-gradient-dark before:top-0 before:-left-[1px] before:z-10 before:rotate-180 before:transition before:duration-300 after:transition after:duration-300 before:pointer-events-none after:pointer-events-none',
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
    handleOverflowCalculation();
  }, [scrollableElement, x]);

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
