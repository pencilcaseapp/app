import classNames from 'classnames';
import type { FC } from 'react';
import { PricingCard } from '../pricing-card/pricing-card';
import type { PricingCardProps } from '../pricing-card/pricing-card';

export type PlanComparisonPlan
  = Omit<PricingCardProps, 'background' | 'size' | 'className'>;

export interface PlanComparisonProps {
  currentPlan: PlanComparisonPlan;
  upgradePlan: PlanComparisonPlan;
  className?: string;
}

export const PlanComparison: FC<PlanComparisonProps> = ({
  currentPlan,
  upgradePlan,
  className,
}) => {
  return (
    <div className={classNames('@container', className)}>
      <div className="grid items-stretch gap-4 @lg:grid-cols-2">
        <PricingCard {...upgradePlan} background="yellow" />
        <PricingCard
          {...currentPlan}
          background="white"
          className="@lg:order-first"
        />
      </div>
    </div>
  );
};
