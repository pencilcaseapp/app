import classNames from 'classnames';
import type { PolymorphicComponentProp } from '../polymorphic-types/polymorphic-types';
import { Typography, type TypographyProps } from '../typography/typography';

export type LinkProps<C extends React.ElementType>
  = PolymorphicComponentProp<C, TypographyProps>;

export function Link<C extends React.ElementType = 'a'>(
  { as = 'a' as C,
    variant = 'bodySmall',
    fontWeight = 'semibold',
    textColorLight = 'grey-900',
    textColorDark = 'white',
    className,
    ...rest }: LinkProps<C>,
) {
  const classes = classNames([
    'inline-block rounded-sm underline decoration-[1.5px] underline-offset-[5px] transition-colors focus:outline-hidden focus-visible:ring-4 focus-visible:ring-pca-blue-300 decoration-inherit',
    className,
  ]);

  return (
    <Typography
      {...rest}
      as={as as React.ElementType}
      variant={variant}
      fontWeight={fontWeight}
      textColorLight={textColorLight}
      textColorDark={textColorDark}
      className={classes}
    />
  );
};
