import { useId, type FC, type ReactNode } from 'react';
import classNames from 'classnames';
import { Typography } from '../typography/typography';

export interface DangerZoneProps {
  className?: string;
  title: ReactNode;
  description: ReactNode;
  /** The destructive action, usually a red button. */
  actionArea: ReactNode;
}

const textColor = {
  textColorLight: 'red-900',
  textColorDark: 'red-300',
} as const;

/**
 * A red box for an action that cannot easily be undone, named by its
 * title. The action sits beside the text and below it on small screens.
 */
export const DangerZone: FC<DangerZoneProps> = ({
  className,
  title,
  description,
  actionArea,
}) => {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={classNames(
        'flex items-center justify-between gap-4 rounded-xl border border-pca-red-500/25 bg-pca-red-100 p-4 max-sm:flex-col max-sm:items-stretch sm:pr-5 dark:border-pca-red-900 dark:bg-pca-red-900/20',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Typography
          id={titleId}
          variant="bodySmall"
          fontWeight="semibold"
          as="h3"
          {...textColor}
        >
          {title}
        </Typography>
        <Typography
          variant="bodyTiny"
          className="text-balance"
          {...textColor}
        >
          {description}
        </Typography>
      </div>
      <div className="flex shrink-0 flex-col">
        {actionArea}
      </div>
    </section>
  );
};
