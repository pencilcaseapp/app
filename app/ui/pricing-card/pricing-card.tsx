import classNames from 'classnames';
import type { FC, ReactNode } from 'react';
import { ListItem } from '../list-item/list-item';
import type { PriceBackground } from '../price/price';
import { Price } from '../price/price';
import { Typography } from '../typography/typography';

export type PricingCardSize = 'default' | 'compact';

export interface PricingCardProps {
  plan: string;
  amount: string;
  period: string;
  /** The card surface. `yellow` is the upgrade card, which keeps
   * its colors in both themes; `white` follows the page theme,
   * e.g. to compare plans side by side. */
  background?: PriceBackground;
  /** `compact` is the small card for a row of plans above a
   * `PlanMatrix`: tighter padding, a smaller price and room for the
   * badge on narrow screens. */
  size?: PricingCardSize;
  /** A `Badge` marking the plan, e.g. the current one. */
  badge?: ReactNode;
  features?: string[];
  /** Features the plan lacks, listed after `features` with a muted X. */
  missingFeatures?: string[];
  actionArea?: ReactNode;
  finePrint?: string;
  className?: string;
}

/*
 * The pricing card: plan name and price on the yellow upgrade surface
 * or the flat white one, with optional feature list, action area and
 * fine print. The badge sits at the end of the plan-name row; in a
 * compact card below `sm` the name would wrap beside it, so the badge
 * moves to a row at the top, reserved in every card so the prices in
 * a row keep one baseline.
 */
export const PricingCard: FC<PricingCardProps> = ({
  plan,
  amount,
  period,
  background = 'yellow',
  size = 'default',
  badge,
  features = [],
  missingFeatures = [],
  actionArea,
  finePrint,
  className,
}) => {
  const onYellow = background === 'yellow';
  const compact = size === 'compact';
  const mutedColorLight = onYellow ? 'yellow-900' : 'grey-600';
  const mutedColorDark = onYellow ? 'yellow-900' : 'grey-400';

  return (
    <div
      className={classNames(
        'rounded-2xl text-left',
        compact ? 'p-3' : 'p-6',
        onYellow && [
          'bg-pca-yellow-500 border border-pca-grey-900',
          // `-rotate-1` sets `rotate`, which `transform-none` would not
          // reset, so reduced motion keeps the tilt and drops the hover.
          '-rotate-1 transition-transform duration-150 ease-out',
          'has-[button:hover]:rotate-0',
          'motion-reduce:transition-none',
          'motion-reduce:has-[button:hover]:-rotate-1',
        ],
        !onYellow && [
          'border border-pca-grey-200 bg-pca-white',
          'dark:border-pca-grey-700 dark:bg-pca-grey-900',
        ],
        className,
      )}
    >
      {compact && (
        <div className="mb-2 flex h-6.5 items-center sm:hidden">{badge}</div>
      )}
      <div className="flex items-start justify-between gap-2">
        <Typography
          variant="bodyTiny"
          fontWeight="semibold"
          textColorLight={mutedColorLight}
          textColorDark={mutedColorDark}
          className="leading-[18px] tracking-[0.02em]"
        >
          {plan}
        </Typography>
        {badge && (
          <div
            className={classNames('-mt-1 -mr-1 shrink-0', {
              'hidden sm:block': compact,
            })}
          >
            {badge}
          </div>
        )}
      </div>
      <Price
        amount={amount}
        period={period}
        background={background}
        size={compact ? 'small' : 'default'}
        className={compact ? 'mt-1' : 'mt-1.5'}
      />
      {actionArea && <div className="mt-5">{actionArea}</div>}
      {finePrint && (
        <Typography
          variant="bodyTiny"
          textAlign="center"
          textColorLight={mutedColorLight}
          textColorDark={mutedColorDark}
          className="mt-3"
        >
          {finePrint}
        </Typography>
      )}
      {(features.length > 0 || missingFeatures.length > 0) && (
        <ul className="mt-4 flex flex-col gap-3">
          {features.map(feature => (
            <ListItem
              key={feature}
              iconColorDark={onYellow ? 'grey-900' : 'white'}
              textColorDark={onYellow ? 'grey-900' : 'white'}
            >
              {feature}
            </ListItem>
          ))}
          {missingFeatures.map(feature => (
            <ListItem
              key={feature}
              icon="close"
              iconColorLight={onYellow ? 'yellow-900' : 'grey-400'}
              iconColorDark={onYellow ? 'yellow-900' : 'grey-600'}
              textColorLight={onYellow ? 'grey-900' : 'grey-600'}
              textColorDark={onYellow ? 'grey-900' : 'grey-400'}
            >
              <span className="sr-only">Not included: </span>
              {feature}
            </ListItem>
          ))}
        </ul>
      )}
    </div>
  );
};
