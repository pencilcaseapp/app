import type { FC } from 'react';
import classNames from 'classnames';
import React from 'react';
import { Typography } from '../typography/typography';

export type EmptyStateProps = {
  className?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actionArea?: React.ReactNode;
  imageSrcLight?: string;
  imageSrcDark?: string;
};

export const EmptyState: FC<EmptyStateProps> = ({
  className,
  title,
  description,
  actionArea,
  imageSrcLight = '/welcoming-pencil-light.svg',
  imageSrcDark = '/welcoming-pencil-dark.svg',
}) => {
  return (
    <div
      className={classNames(
        'w-full h-full gap-6 flex flex-col justify-center items-center',
        className,
      )}
    >
      <picture>
        <source srcSet={imageSrcDark} media="(prefers-color-scheme: dark)" />
        <img
          src={imageSrcLight}
          className="block w-45 h-45 ml-auto mr-auto"
          alt=""
        />
      </picture>
      <div className="flex flex-col justify-center items-center gap-3">
        <Typography variant="heading2" textColorLight="black" textColorDark="white" textAlign="center">
          {title}
        </Typography>
        {description && (
          <Typography
            variant="bodySmall"
            textAlign="center"
            textColorLight="grey-900"
            textColorDark="grey-100"
            className="max-w-[30ch]"
          >
            {description}
          </Typography>
        )}
      </div>
      {actionArea}
    </div>
  );
};
