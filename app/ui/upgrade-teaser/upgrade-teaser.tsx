import classNames from 'classnames';
import { Badge } from '../badge/badge';
import { Icon } from '../icon/icon';
import type { PolymorphicComponentPropWithRef } from '../polymorphic-types/polymorphic-types';
import { Typography } from '../typography/typography';

export type UpgradeTeaserProps<C extends React.ElementType>
  = PolymorphicComponentPropWithRef<
    C,
    {
      /** The plan the teaser sells, shown in the badge. */
      plan: string;
      /** The feature behind the plan. */
      title: string;
      /** The call to action at the end of the row. */
      action: string;
      className?: string;
    }
  >;

/**
 * The yellow fill does not follow the page theme, so the badge and the
 * text are pinned to the dark look in both of them, like the pricing
 * card.
 */
export function UpgradeTeaser<C extends React.ElementType = 'a'>(
  { as,
    plan,
    title,
    action,
    className,
    ref,
    ...rest }: UpgradeTeaserProps<C>,
) {
  const Component = as || 'a';

  return (
    <Component
      {...rest}
      ref={ref}
      className={classNames([
        'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 no-underline',
        'bg-pca-yellow-500 hover:bg-pca-yellow-700 active:bg-pca-yellow-700',
        'dark:bg-pca-yellow-500 dark:hover:bg-pca-yellow-700',
        'dark:active:bg-pca-yellow-700',
        'transition-[background-color,scale] duration-150 ease-out',
        'active:scale-[0.99] motion-reduce:transition-none',
        'motion-reduce:active:scale-100',
        'focus:outline-hidden focus-visible:ring-2',
        'focus-visible:ring-pca-grey-500',
        className,
      ])}
    >
      <Badge variant="dark">{plan}</Badge>
      <Typography
        as="span"
        variant="bodySmall"
        fontWeight="medium"
        textColorLight="grey-900"
        textColorDark="grey-900"
        className="min-w-0 flex-1 truncate"
      >
        {title}
      </Typography>
      <Typography
        as="span"
        variant="bodySmall"
        fontWeight="semibold"
        textColorLight="grey-900"
        textColorDark="grey-900"
        className="shrink-0"
      >
        {action}
      </Typography>
      <Icon
        icon="chevronRight"
        className={classNames([
          '-ml-2 h-4.5 w-4.5 shrink-0',
          'text-pca-grey-900 dark:text-pca-grey-900',
        ])}
      />
    </Component>
  );
};
