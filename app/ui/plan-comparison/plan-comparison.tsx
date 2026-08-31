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
 * card. Below Tailwind's `sm` breakpoint the cards stack, the upgrade
 * first.
 */
export const PlanComparison: FC<PlanComparisonProps> = ({
  currentPlan,
  upgradePlan,
  className,
}) => {
  return (
    <div
      className={classNames(
        'grid items-stretch gap-4 sm:grid-cols-2',
        className,
      )}
    >
      <PricingTable
        {...currentPlan}
        background="white"
        className="order-last sm:order-none"
      />
      <PricingTable {...upgradePlan} background="yellow" />
    </div>
  );
};
