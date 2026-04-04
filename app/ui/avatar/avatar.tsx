import { Typography } from '../typography/typography';
import classNames from 'classnames';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';
import { Tooltip } from '../tooltip/tooltip';

export type AvatarProps<C extends React.ElementType>
  = PolymorphicComponentPropWithRef<
    C,
    {
      name: string;
      size?: 'small' | 'large';
      color?: string;
      className?: string;
    }
  >;

const nameToFirstCharacter = (name: string) => {
  return name.trim().charAt(0).toUpperCase();
};

export const Avatar = <C extends React.ElementType = 'button'>({
  as,
  name,
  color,
  size = 'small',
  className,
  ref,
  ...props
}: AvatarProps<C>) => {
  const avatarSizeSmall = size === 'small' && 'h-[28px] w-[28px]';
  const avatarSizeLarge = size === 'large' && 'h-[40px] w-[40px]';

  const Component = as ?? 'button';
  return (
    <Tooltip tooltip={name}>
      <Component
        {...props}
        ref={ref}
        className={classNames(
          'flex items-center group flex-row gap-3',
          className,
        )}
      >

        <abbr
          aria-label={name}
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
            {nameToFirstCharacter(name)}
          </Typography>
        </abbr>
      </Component>
    </Tooltip>
  );
};
