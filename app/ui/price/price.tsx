import classNames from 'classnames';
import { Typography } from '../typography/typography';

export type PriceBackground = 'yellow' | 'white';

export interface PriceProps {
  amount: string;
  period: string;
  /** The surface the price sits on. `yellow` is the pricing card,
   * which keeps the same colors in both themes; `white` follows the
   * page background. */
  background?: PriceBackground;
  className?: string;
}

export const Price: React.FC<PriceProps> = ({
  amount,
  period,
  background = 'yellow',
  className,
}) => {
  return (
    <p className={classNames('flex items-baseline gap-2', className)}>
      <Typography
        as="span"
        variant="heading1"
        textColorLight="grey-900"
        textColorDark={background === 'yellow' ? 'grey-900' : 'white'}
      >
        {amount}
      </Typography>
      <Typography
        as="span"
        variant="bodySmall"
        fontWeight="medium"
        textColorLight={background === 'yellow' ? 'yellow-900' : 'grey-600'}
        textColorDark={background === 'yellow' ? 'yellow-900' : 'grey-400'}
      >
        {period}
      </Typography>
    </p>
  );
};
