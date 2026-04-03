import { forwardRef } from 'react';
import { Typography } from '../typography/typography';
import classNames from 'classnames';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';
import { Tooltip } from '../tooltip/tooltip';

export type AvatarSize = 'small' | 'large';

export type AvatarProps<C extends React.ElementType>
  = PolymorphicComponentPropWithRef<
    C,
    {
      name?: string;
      size?: 'small' | 'large';
      color?: string;
    }
  >;

const nameToFirstCharacter = (name: string) => {
  return name.trim().charAt(0).toUpperCase();
};

type AvatarComponent = <C extends React.ElementType = 'button'>(
  props: AvatarProps<C>,
) => React.ReactElement | null;

export const Avatar = forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      name,
      color,
      size = 'small',
      ...props
    }: AvatarProps<C>,
    ref: unknown,
  ) => {
    const avatarSizeSmall = size === 'small' && 'h-[28px] w-[28px]';
    const avatarSizeLarge = size === 'large' && 'h-[40px] w-[40px]';

    const Component = as ?? 'div';
    return (
      <Component
        {...props}
        ref={ref}
        className={classNames(
          'flex items-center group flex-row gap-3',
        )}
      >
        <Tooltip tooltip={name}>
          <abbr
            className={classNames(
              'flex shrink-0 items-center justify-center rounded-full no-underline relative border',
              !color && 'bg-pca-yellow-500 text-pca-grey-900 border border-pca-grey-800',
              avatarSizeSmall,
              avatarSizeLarge,
              color && 'border-pca-white text-pca-white dark:border-pca-grey-900',
            )}
            style={{ backgroundColor: color ? color : undefined }}
          >
            <Typography
              variant={size === 'small' ? 'bodyTiny' : 'bodySmall'}
              fontWeight="medium"
              className="text-inherit!"
              as="span"
            >
              {nameToFirstCharacter(name!)}
            </Typography>
          </abbr>
        </Tooltip>

      </Component>
    );
  },
) as AvatarComponent;
