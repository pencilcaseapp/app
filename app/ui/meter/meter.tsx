import { Meter as BaseMeter } from '@base-ui/react/meter';
import classNames from 'classnames';
import { Typography } from '../typography/typography';

export interface MeterProps {
  /** Visible label above the track. Also names the meter for
   * assistive technology. */
  label: string;
  value: number;
  min?: number;
  max?: number;
  className?: string;
}

export const Meter: React.FC<MeterProps> = ({
  label,
  value,
  min,
  max,
  className,
}) => {
  const trackClasses = classNames([
    'h-1.5 w-full overflow-hidden rounded-full',
    'border border-pca-grey-900',
    'bg-pca-grey-100 dark:bg-pca-grey-700',
  ]);

  return (
    <BaseMeter.Root
      value={value}
      min={min}
      max={max}
      className={classNames('flex w-full flex-col gap-2', className)}
    >
      <BaseMeter.Label
        render={(
          <Typography
            as="span"
            variant="bodySmall"
            fontWeight="semibold"
            textAlign="center"
          />
        )}
      >
        {label}
      </BaseMeter.Label>
      <BaseMeter.Track className={trackClasses}>
        <BaseMeter.Indicator className="bg-pca-orange-500" />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
};
