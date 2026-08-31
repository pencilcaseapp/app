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
  background = 'yellow',
  actionArea,
  finePrint,
  className,
}) => {
  const onYellow = background === 'yellow';

  const cardClasses = classNames([
    'rounded-2xl p-6',
    onYellow && [
      'bg-pca-yellow-500 shadow-lg shadow-pca-yellow-900/20',
      '-rotate-1 transition-transform duration-300 ease-out hover:rotate-0',
      'motion-reduce:transform-none motion-reduce:transition-none',
    ],
    !onYellow && [
      'border border-pca-grey-200 bg-pca-white',
      'dark:border-pca-grey-700 dark:bg-pca-grey-800',
    ],
  ]);

  return (
    <div className={classNames(cardClasses, className)}>
      <Typography
        variant="bodyTiny"
        fontWeight="bold"
        textTransform="uppercase"
        textColorLight={onYellow ? 'yellow-900' : 'grey-600'}
        textColorDark={onYellow ? 'yellow-900' : 'grey-400'}
        className="tracking-[0.16em]"
      >
        {plan}
      </Typography>
      <Price
        amount={amount}
        period={period}
        background={background}
        className="mt-1.5"
      />
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
      </ul>
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
    </div>
  );
};
