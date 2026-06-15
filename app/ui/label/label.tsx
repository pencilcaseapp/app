import { Typography } from '../typography/typography';
import type { PropsWithChildren } from 'react';

export interface Label extends PropsWithChildren {
  htmlFor: string;
  disabled?: boolean;
}

export const Label: React.FC<Label>
  = ({ htmlFor, disabled, children }) => {
    return (
      <Typography
        htmlFor={htmlFor}
        as="label"
        variant="bodySmall"
        fontWeight="semibold"
        textColorLight={disabled ? 'grey-300' : 'grey-900'}
        textColorDark={disabled ? 'grey-800' : 'grey-300'}
      >
        {children}
      </Typography>
    );
  };
