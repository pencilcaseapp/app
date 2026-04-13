import { useEffect, useRef, useState } from 'react';
import { HorizontalOverflow } from '../horizontal-overflow/horizontal-overflow';
import classNames from 'classnames';
import { useWindowScroll } from 'react-use';

export type TopbarProps = {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  hasBorder?: boolean;
  ref: React.Ref<HTMLElement>;
};

export const Topbar: React.FC<TopbarProps>
  = ({ left, center, right, hasBorder, ref }) => {
    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const [leftWidth, setLeftWidth] = useState(0);
    const [rightWidth, setRightWidth] = useState(0);

    useEffect(() => {
      const update = () => {
        const leftElement = leftRef.current?.offsetWidth
          ? (leftRef.current.offsetWidth + 16)
          : 0;

        const rightElement = rightRef.current?.offsetWidth
          ? (rightRef.current.offsetWidth + 6)
          : 0;

        // eslint-disable-next-line @eslint-react/set-state-in-effect
        setLeftWidth(leftElement);
        // eslint-disable-next-line @eslint-react/set-state-in-effect
        setRightWidth(rightElement);
      };

      update();

      const observer = new ResizeObserver(update);
      if (leftRef.current) observer.observe(leftRef.current);
      if (rightRef.current) observer.observe(rightRef.current);

      return () => observer.disconnect();
    }, []);

    const { y } = useWindowScroll();
    const isScrolling = y > 30;
    const showBorder = hasBorder || isScrolling;

    return (
      <header
        ref={ref}
        className={classNames('fixed z-50 w-full top-0 left-0 h-14 px-2 grid grid-cols-1 grid-rows-1 items-center bg-pca-white dark:bg-pca-grey-900 lg:bg-transparent dark:lg:bg-transparent',
          showBorder && 'border-b border-pca-grey-200 dark:border-pca-grey-800 lg:border-none',
        )}
      >
        <div ref={leftRef} className="col-start-1 row-start-1 justify-self-start z-10 flex min-w-max">
          {left}
        </div>
        <div
          className="col-start-1 row-start-1 justify-self-center max-w-full"
          style={{
            paddingLeft: leftWidth,
            paddingRight: rightWidth,
          }}
        >
          <HorizontalOverflow className="md:block">
            <div
              className="flex gap-4 md:gap-2 flex-nowrap h-14 items-center"
              style={{
                paddingLeft: Math.max(leftWidth, rightWidth) - leftWidth,
                paddingRight: Math.max(leftWidth, rightWidth) - rightWidth,
              }}
            >
              {center}
            </div>
          </HorizontalOverflow>
        </div>

        <div ref={rightRef} className="col-start-1 row-start-1 justify-self-end z-10 flex min-w-max items-center">
          <div className="inline-flex min-w-max items-center gap-2">
            {right}
          </div>
        </div>
      </header>
    );
  };
