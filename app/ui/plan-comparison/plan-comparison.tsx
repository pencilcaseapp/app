import classNames from 'classnames';
import type { FC } from 'react';
import { PricingTable } from '../pricing-table/pricing-table';
import type { PricingTableProps } from '../pricing-table/pricing-table';

export type PlanComparisonPlan
  = Omit<PricingTableProps, 'background' | 'className'>;

export interface PlanComparisonProps {
  /** The plan the user is on, rendered flat on the page surface. */
  currentPlan: PlanComparisonPlan;
  /** The plan to upsell, rendered as the yellow upgrade card. */
  upgradePlan: PlanComparisonPlan;
  className?: string;
}

/*
 * Compares the current plan against the upgrade side by side: the
 * current plan follows the page theme, the upgrade keeps the yellow
 * card. The columns follow the container rather than the viewport, so
 * the cards also stack inside a narrow dialog column: below Tailwind's
 * `@lg` container step (32rem) the upgrade sits on top — it also comes
 * first in the DOM, so the reading order matches the stacked layout.
 */
export const PlanComparison: FC<PlanComparisonProps> = ({
  currentPlan,
  upgradePlan,
  className,
}) => {
  return (
    <div className={classNames('@container', className)}>
      <div className="grid items-stretch gap-4 @lg:grid-cols-2">
        <PricingTable {...upgradePlan} background="yellow" />
        <PricingTable
          {...currentPlan}
          background="white"
          className="@lg:order-first"
        />
      </div>
    </div>
  );
};
