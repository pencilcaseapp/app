import type { FC } from 'react';
import {
  FREE_PLAN,
  PLAN_MATRIX_PLANS,
  PLAN_MATRIX_ROWS,
  PRO_PLAN,
} from '~/constants/plans';
import { Badge } from '~/ui/badge/badge';
import { PlanMatrix } from '~/ui/plan-matrix/plan-matrix';
import { PricingCard } from '~/ui/pricing-card/pricing-card';
import { Typography } from '~/ui/typography/typography';

export interface PlanOverviewProps {
  /** The illustration above the headline, a pair of SVGs in `public/`. */
  image: 'flying-docs' | 'welcoming-pencil';
  headline: string;
  /** A muted line below the headline, e.g. the state of the plan. */
  subheadline?: string | null;
  /** The plan that carries the "Current" badge. */
  currentPlan: 'free' | 'pro';
}

/*
 * The body of the subscription section: a headline about the reader's
 * own plan, the two plans as compact pricing cards in a row and the
 * feature matrix below. See docs/design-decisions.md.
 */
export const PlanOverview: FC<PlanOverviewProps> = ({
  image,
  headline,
  subheadline,
  currentPlan,
}) => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-col items-center pt-1 text-center">
      <picture>
        <source
          srcSet={`/${image}-dark.svg`}
          media="(prefers-color-scheme: dark)"
        />
        <img
          src={`/${image}-light.svg`}
          className="mb-2 block h-24 w-auto"
          width="180"
          height="132"
          alt=""
        />
      </picture>
      <Typography
        variant="heading2"
        as="h3"
        textAlign="center"
        className="text-balance"
      >
        {headline}
      </Typography>
      {subheadline && (
        <Typography
          variant="bodySmall"
          textAlign="center"
          textColorLight="grey-600"
          textColorDark="grey-400"
          className="mt-1.5"
        >
          {subheadline}
        </Typography>
      )}
    </div>
    <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3">
      <PricingCard
        plan={FREE_PLAN.plan}
        amount={FREE_PLAN.amount}
        period={FREE_PLAN.period}
        size="compact"
        background="white"
        badge={currentPlan === 'free' && (
          <Badge variant="neutral">Current</Badge>
        )}
      />
      <PricingCard
        plan={PRO_PLAN.plan}
        amount={PRO_PLAN.amount}
        period={PRO_PLAN.period}
        size="compact"
        badge={currentPlan === 'pro' && <Badge variant="dark">Current</Badge>}
      />
    </div>
    <PlanMatrix
      caption="What the free and the pro plan include"
      plans={PLAN_MATRIX_PLANS}
      rows={PLAN_MATRIX_ROWS}
    />
  </div>
);
