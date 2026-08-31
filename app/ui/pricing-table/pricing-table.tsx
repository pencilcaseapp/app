import classNames from 'classnames';
import { FeatureListItem } from '../feature-list-item/feature-list-item';
import { Price } from '../price/price';
import { Typography } from '../typography/typography';

export interface PricingTableProps {
  plan: string;
  amount: string;
  period: string;
  features: string[];
  actionArea?: React.ReactNode;
  finePrint?: string;
  className?: string;
}

export const PricingTable: React.FC<PricingTableProps> = ({
  plan,
  amount,
  period,
  features,
  actionArea,
  finePrint,
  className,
}) => {
  const cardClasses = classNames([
    'rounded-2xl bg-pca-yellow-500 p-6',
    'shadow-lg shadow-pca-yellow-900/20',
    '-rotate-1 transition-transform duration-300 ease-out hover:rotate-0',
    'motion-reduce:transform-none motion-reduce:transition-none',
  ]);

  return (
    <div className={classNames(cardClasses, className)}>
      <Typography
        variant="bodyTiny"
        fontWeight="bold"
        textTransform="uppercase"
        textColorLight="yellow-900"
        textColorDark="yellow-900"
        className="tracking-[0.16em]"
      >
        {plan}
      </Typography>
      <Price amount={amount} period={period} className="mt-1.5" />
      <ul className="mt-4 flex flex-col gap-3">
        {features.map(feature => (
          <FeatureListItem key={feature} textColorDark="grey-900">
            {feature}
          </FeatureListItem>
        ))}
      </ul>
      {actionArea && <div className="mt-5">{actionArea}</div>}
      {finePrint && (
        <Typography
          variant="bodyTiny"
          textAlign="center"
          textColorLight="yellow-900"
          textColorDark="yellow-900"
          className="mt-3"
        >
          {finePrint}
        </Typography>
      )}
    </div>
  );
};
