import classNames from 'classnames';
import { Typography } from '../typography/typography';
import type { PropsWithChildren } from 'react';

export interface Label extends PropsWithChildren {
  htmlFor: string;
  disabled?: boolean;
}

export const Label: React.FC<Label>
  = ({ htmlFor, disabled, children }) => {
    const classes = classNames(disabled && '!text-pca-grey-300 dark:!text-pca-grey-800');

    return (
      <Typography
        htmlFor={htmlFor}
        as="label"
        variant="bodySmall"
        fontWeight="semibold"
        textColorLight="grey-900"
        textColorDark="grey-300"
        className={classes}
      >
        {children}
      </Typography>
    );
  };
