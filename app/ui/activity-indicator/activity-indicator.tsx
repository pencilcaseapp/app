import classNames from 'classnames';

export interface ActivityIndicatorProps {
  /**
   * How much of the wheel is drawn, from 0 to 1. The spokes come in one at
   * a time, clockwise from the top, the way iOS reveals its spinner while
   * a list is pulled down.
   */
  progress?: number;
  spinning?: boolean;
  className?: string;
}

const SPOKES = 8;
const spokes = Array.from({ length: SPOKES }, (_, index) => index);

/** The spinning wheel iOS shows while something loads. */
export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  progress = 1,
  spinning = false,
  className,
}) => {
  const visibleSpokes = spinning
    ? SPOKES
    : Math.round(Math.min(Math.max(progress, 0), 1) * SPOKES);

  return (
    <div
      role="status"
      aria-label="loading"
      className={classNames('size-5', className)}
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className={classNames(
          'size-full',
          spinning && 'animate-activity-spin',
        )}
      >
        {spokes.slice(0, visibleSpokes).map(index => (
          <line
            key={index}
            x1="10"
            y1="1.5"
            x2="10"
            y2="5.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            transform={`rotate(${index * 360 / SPOKES} 10 10)`}
            // Spinning, the wheel fades out behind the spoke in front.
            opacity={spinning ? 1 - ((SPOKES - index) % SPOKES) * 0.1 : 0.8}
          />
        ))}
      </svg>
    </div>
  );
};
