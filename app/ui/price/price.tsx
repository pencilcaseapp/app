import classNames from 'classnames';
import { Typography } from '../typography/typography';

export type PriceBackground = 'yellow' | 'white';

export type PriceSize = 'default' | 'small';

export interface PriceProps {
  amount: string;
  period: string;
  /** The surface the price sits on. `yellow` is the pricing card,
   * which keeps the same colors in both themes; `white` follows the
   * page background. */
  background?: PriceBackground;
  /** `small` is the compact pricing card, where the period may wrap
   * under the amount. */
  size?: PriceSize;
  className?: string;
}

export const Price: React.FC<PriceProps> = ({
  amount,
  period,
  background = 'yellow',
  size = 'default',
  className,
}) => {
  const small = size === 'small';

  return (
    <p
      className={classNames(
        'flex items-baseline',
        small ? 'flex-wrap gap-x-1.5' : 'gap-2',
        className,
      )}
    >
      <Typography
        as="span"
        variant="title"
        fontWeight="semibold"
        textColorLight="grey-900"
        textColorDark={background === 'yellow' ? 'grey-900' : 'white'}
        className={classNames(small && 'text-3xl!')}
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
