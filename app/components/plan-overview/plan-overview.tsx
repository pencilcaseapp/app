import type { FC, PropsWithChildren } from 'react';
import { FREE_PLAN, PRO_PLAN } from '~/constants/plans';
import { Badge } from '~/ui/badge/badge';
import { PricingCard } from '~/ui/pricing-card/pricing-card';
import { Typography } from '~/ui/typography/typography';

// Pairs of SVGs in `public/`, with the size they were drawn at.
const illustrations = {
  'flying-docs': { width: 180, height: 132 },
  'pencil-and-doc': { width: 158, height: 180 },
};

export interface PlanOverviewProps extends PropsWithChildren {
  image: keyof typeof illustrations;
  headline: string;
  /** A muted line below the headline. */
  subheadline?: string;
  /** The plan the reader is on. */
  currentPlan: 'free' | 'pro';
}

/*
 * The opening of the subscription section: a headline about the
 * reader's own plan over the two plans as compact pricing cards, with
 * whatever the view adds below them as children. The current plan sits
 * flat and carries the badge while the other card is tilted; once on
 * pro the free card is greyed out as well, so only one card reads as
 * active. See docs/design-decisions.md.
 */
export const PlanOverview: FC<PlanOverviewProps> = ({
  image,
  headline,
  subheadline,
  currentPlan,
  children,
}) => {
  const onPro = currentPlan === 'pro';

  return (
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
            width={illustrations[image].width}
            height={illustrations[image].height}
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
          tilted={onPro}
          disabled={onPro}
          badge={!onPro && <Badge variant="neutral">Current</Badge>}
        />
        <PricingCard
          plan={PRO_PLAN.plan}
          amount={PRO_PLAN.amount}
          period={PRO_PLAN.period}
          size="compact"
          tilted={!onPro}
          badge={onPro && <Badge variant="dark">Current</Badge>}
        />
      </div>
      {children}
    </div>
  );
};
