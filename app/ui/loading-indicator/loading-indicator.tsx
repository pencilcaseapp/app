import classNames from 'classnames';

export interface LoadingIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const dots = [0, 1, 2] as const;

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  className,
  ...props
}) => {
  const dotSize = 'w-1 h-1';
  const gap = 'gap-1';

  return (
    <div
      className={classNames(
        'pointer-events-none flex items-center justify-center',
        className,
      )}
      {...props}
    >
      <div
        className={classNames(
          'flex items-center justify-center w-6 h-6',
          gap,
        )}
        role="status"
        aria-label="loading"
      >
        {dots.map(i => (
          <div
            key={i}
            className={classNames(
              dotSize,
              'rounded-full bg-current animate-[bounce-dot_1.4s_ease-in-out_infinite]',
            )}
            style={{ animationDelay: `${i * 0.16}s` }}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};
