import classNames from 'classnames';
import type { FC, ReactNode } from 'react';
import type { PriceBackground } from '../price/price';
import { Price } from '../price/price';
import { pricingSurfaceClasses } from '../pricing-table/pricing-surface';
import { Typography } from '../typography/typography';

export interface PlanCardProps {
  plan: string;
  amount: string;
  period: string;
  /** The card surface, see `PricingTable`. */
  background?: PriceBackground;
  /** A `Badge` marking the plan, e.g. the current one. */
  badge?: ReactNode;
  className?: string;
}

/*
 * The compact pricing card: the surface of `PricingTable` around the
 * plan name and the price, for a row of plans above a `PlanMatrix`.
 * The badge sits at the end of the plan-name row; below `sm` the cards
 * are half a drawer wide and the name would wrap beside it, so the
 * badge moves to a row at the top, reserved in every card so the
 * prices in a row keep one baseline.
 */
export const PlanCard: FC<PlanCardProps> = ({
  plan,
  amount,
  period,
  background = 'yellow',
  badge,
  className,
}) => {
  const onYellow = background === 'yellow';

  return (
    <div
      className={classNames(
        'rounded-2xl p-3 text-left',
        pricingSurfaceClasses(background),
        className,
      )}
    >
      <div className="mb-2 flex h-6.5 items-center sm:hidden">{badge}</div>
      <div className="flex items-start justify-between gap-2">
        <Typography
          variant="bodyTiny"
          fontWeight="semibold"
          textColorLight={onYellow ? 'yellow-900' : 'grey-600'}
          textColorDark={onYellow ? 'yellow-900' : 'grey-400'}
          className="leading-[18px] tracking-[0.02em]"
        >
          {plan}
        </Typography>
        {badge && (
          <div className="-mt-1 -mr-1 hidden shrink-0 sm:block">{badge}</div>
        )}
      </div>
      <Price
        amount={amount}
        period={period}
        background={background}
        className="mt-1 flex-wrap gap-x-1.5 [&>span:first-child]:text-3xl"
      />
    </div>
  );
};
