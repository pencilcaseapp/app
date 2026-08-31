import classNames from 'classnames';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';
import type { TypographyProps } from '../typography/typography';
import { Typography } from '../typography/typography';

export type FeatureListItemIconColor = 'default' | 'success' | 'danger';

export interface FeatureListItemProps {
  children: React.ReactNode;
  icon?: IconName;
  iconColor?: FeatureListItemIconColor;
  textColorLight?: TypographyProps['textColorLight'];
  textColorDark?: TypographyProps['textColorDark'];
  className?: string;
}

export const FeatureListItem: React.FC<FeatureListItemProps> = ({
  children,
  icon = 'check',
  iconColor = 'default',
  textColorLight = 'grey-900',
  textColorDark = 'white',
  className,
}) => {
  const iconClasses = classNames([
    'h-4.5 w-4.5 shrink-0',
    iconColor === 'default' && 'text-pca-grey-900',
    iconColor === 'success' && 'text-pca-green-700',
    iconColor === 'danger' && 'text-pca-red-500',
  ]);

  return (
    <li className={classNames('flex items-center gap-2.5', className)}>
      <Icon icon={icon} className={iconClasses} />
      <Typography
        as="span"
        variant="bodySmall"
        fontWeight="medium"
        textColorLight={textColorLight}
        textColorDark={textColorDark}
      >
        {children}
      </Typography>
    </li>
  );
};
