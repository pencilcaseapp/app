import classNames from 'classnames';
import type { FC, ReactNode } from 'react';
import { Typography } from '../typography/typography';

export interface PlanSummaryProps {
  /** The product the plan belongs to, above the plan name. */
  product: string;
  plan: string;
  /** The price line, e.g. `25 €` and `renews yearly`. */
  price?: string;
  period?: string;
  /** Sits next to the plan name, e.g. a status badge. */
  badge?: ReactNode;
  /** A muted line below the price, e.g. the renewal date. */
  detail?: ReactNode;
  className?: string;
}

/**
 * The header of a subscription plan: product, plan name with an
 * optional badge, the price and a detail line.
 */
export const PlanSummary: FC<PlanSummaryProps> = ({
  product,
  plan,
  price,
  period,
  badge,
  detail,
  className,
}) => {
  return (
    <div className={classNames('flex flex-col', className)}>
      <Typography variant="bodyTiny" as="span">
        {product}
      </Typography>
      <div className="flex items-center justify-between gap-3">
        <h3
          className={classNames([
            'font-inter text-[28px] font-bold antialiased',
            'text-pca-grey-900 dark:text-pca-white',
          ])}
        >
          {plan}
        </h3>
        {badge}
      </div>
      {price && (
        <p className="mt-1">
          <Typography as="span" variant="body">
            {price}
          </Typography>
          {period && (
            <Typography as="span" variant="bodySmall">
              {` / ${period}`}
            </Typography>
          )}
        </p>
      )}
      {detail && (
        <Typography
          variant="bodyTiny"
          textColorLight="grey-600"
          textColorDark="grey-400"
          className="mt-0.5"
        >
          {detail}
        </Typography>
      )}
    </div>
  );
};
