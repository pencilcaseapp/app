import { Typography, type TypographyProps } from '../typography/typography';
import type { PropsWithChildren } from 'react';

export interface Label extends PropsWithChildren {
  htmlFor: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  variant?: TypographyProps['variant'];
  fontWeight?: TypographyProps['fontWeight'];
}

export const Label: React.FC<Label>
  = ({ htmlFor,
    id,
    disabled,
    className,
    variant = 'bodySmall',
    fontWeight = 'semibold',
    children,
  }) => {
    return (
      <Typography
        id={id}
        htmlFor={htmlFor}
        as="label"
        variant={variant}
        fontWeight={fontWeight}
        textColorLight={disabled ? 'grey-300' : 'grey-900'}
        textColorDark={disabled ? 'grey-800' : 'grey-300'}
        className={className}
      >
        {children}
      </Typography>
    );
  };
