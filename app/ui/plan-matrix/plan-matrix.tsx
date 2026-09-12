import classNames from 'classnames';
import type { FC } from 'react';
import { Icon } from '../icon/icon';
import { Typography } from '../typography/typography';

/** A cell: a value to print, or whether the feature is included. */
export type PlanMatrixCell = string | boolean;

export interface PlanMatrixPlan {
  name: string;
  /** Sets the plan's column in the strong text colour. */
  emphasis?: boolean;
}

export interface PlanMatrixRow {
  label: string;
  /** One cell per plan, in the order of `plans`. */
  cells: PlanMatrixCell[];
}

export interface PlanMatrixProps {
  /** Read by assistive technology only. */
  caption: string;
  plans: PlanMatrixPlan[];
  rows: PlanMatrixRow[];
  className?: string;
}

const Cell: FC<{ value: PlanMatrixCell; emphasis: boolean }> = ({
  value,
  emphasis,
}) => {
  if (typeof value === 'string') {
    return (
      <Typography
        as="span"
        variant="bodySmall"
        fontWeight={emphasis ? 'semibold' : 'medium'}
        textColorLight={emphasis ? 'grey-900' : 'grey-600'}
        textColorDark={emphasis ? 'white' : 'grey-400'}
        className="tabular-nums"
      >
        {value}
      </Typography>
    );
  }

  return value
    ? (
        <Typography
          as="span"
          className="inline-flex"
          textColorLight={emphasis ? 'grey-900' : 'grey-600'}
          textColorDark={emphasis ? 'white' : 'grey-400'}
        >
          <Icon icon="check" className="h-4.5 w-4.5" title="Included" />
        </Typography>
      )
    : (
        <Typography
          as="span"
          className="inline-flex"
          textColorLight="grey-400"
          textColorDark="grey-600"
        >
          <Icon icon="close" className="h-4.5 w-4.5" title="Not included" />
        </Typography>
      );
};

/*
 * The feature matrix: one row per feature, one narrow column per plan,
 * a check or a cross where a cell has nothing to print. The plan names
 * are plain column heads, so the feature column keeps its width even
 * in a drawer; the compact `PricingCard`s with the prices go above it.
 */
export const PlanMatrix: FC<PlanMatrixProps> = ({
  caption,
  plans,
  rows,
  className,
}) => {
  return (
    <table className={classNames('w-full border-collapse', className)}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col" className="pb-3 text-left align-bottom">
            <span className="sr-only">Feature</span>
          </th>
          {plans.map(plan => (
            <th
              key={plan.name}
              scope="col"
              className="w-20 px-1 pb-3 text-center align-bottom sm:w-24"
            >
              <Typography
                as="span"
                variant="bodyTiny"
                fontWeight="semibold"
                textColorLight="grey-600"
                textColorDark="grey-400"
                className="leading-[18px] tracking-[0.02em]"
              >
                {plan.name}
              </Typography>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr
            key={row.label}
            className="border-t border-pca-grey-200 dark:border-pca-grey-800"
          >
            <th scope="row" className="py-2 pr-2 text-left align-middle">
              <Typography as="span" variant="bodySmall" fontWeight="medium">
                {row.label}
              </Typography>
            </th>
            {row.cells.map((cell, index) => (
              <td
                key={plans[index]?.name}
                className="h-11 px-2 text-center align-middle"
              >
                <Cell value={cell} emphasis={!!plans[index]?.emphasis} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
