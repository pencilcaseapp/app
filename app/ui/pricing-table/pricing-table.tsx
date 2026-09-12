import classNames from 'classnames';
import { ListItem } from '../list-item/list-item';
import type { PriceBackground } from '../price/price';
import { Price } from '../price/price';
import { Typography } from '../typography/typography';

export interface PricingTableProps {
  plan: string;
  amount: string;
  period: string;
  features: string[];
  /** Features the plan lacks, listed after `features` with a red X. */
  missingFeatures?: string[];
  /** The card surface. `yellow` is the upgrade card, which keeps
   * its colors in both themes; `white` follows the page theme,
   * e.g. to compare plans side by side. */
  background?: PriceBackground;
  actionArea?: React.ReactNode;
  finePrint?: string;
  className?: string;
}

export const PricingTable: React.FC<PricingTableProps> = ({
  plan,
  amount,
  period,
  features,
  missingFeatures = [],
  background = 'yellow',
  actionArea,
  finePrint,
  className,
}) => {
  const onYellow = background === 'yellow';

  const cardClasses = classNames([
    'rounded-2xl p-6',
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
  ]);

  return (
    <div className={classNames(cardClasses, className)}>
      <Typography
        variant="bodyTiny"
        fontWeight="semibold"
        textColorLight={onYellow ? 'yellow-900' : 'grey-600'}
        textColorDark={onYellow ? 'yellow-900' : 'grey-400'}
        className="leading-[18px] tracking-[0.02em]"
      >
        {plan}
      </Typography>
      <Price
        amount={amount}
        period={period}
        background={background}
        className="mt-1.5"
      />
      {actionArea && <div className="mt-5">{actionArea}</div>}
      {finePrint && (
        <Typography
          variant="bodyTiny"
          textAlign="center"
          textColorLight={onYellow ? 'yellow-900' : 'grey-600'}
          textColorDark={onYellow ? 'yellow-900' : 'grey-400'}
          className="mt-3"
        >
          {finePrint}
        </Typography>
      )}
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
            iconColorLight={onYellow ? 'red-700' : 'red-500'}
            iconColorDark={onYellow ? 'red-700' : 'red-500'}
            textColorLight={onYellow ? 'grey-900' : 'grey-600'}
            textColorDark={onYellow ? 'grey-900' : 'grey-400'}
          >
            <span className="sr-only">Not included: </span>
            {feature}
          </ListItem>
        ))}
      </ul>
    </div>
  );
};
